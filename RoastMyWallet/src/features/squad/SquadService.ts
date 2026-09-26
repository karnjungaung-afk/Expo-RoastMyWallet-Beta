import { supabase } from '@/services/supabase';
import type { Squad, SquadMember, SquadMessage, ServiceResult } from '@/types';

// Supabase query results are typed as `any` here because we hand-wrote the
// Database types without full join inference. When you run
// `supabase gen types typescript`, replace these `any` casts with the
// generated types for full type safety.

type AnyRow = Record<string, unknown>;

export class SquadService {
  // ── Create ─────────────────────────────────────────────────────────────

  static async createSquad(name: string, userId: string): Promise<ServiceResult<Squad>> {
    try {
      const inviteCode = generateInviteCode();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: squadData, error } = await (supabase as any)
        .from('squads')
        .insert({
          name: name.trim(), owner_id: userId, invite_code: inviteCode,
          settings: { alertOnSpendingLimit: true, alertThreshold: 80, autoRoastEnabled: false, privacyLevel: 'limits_only' },
        })
        .select()
        .single();

      if (error || !squadData) return { data: null, error: error?.message ?? 'Failed to create squad' };

      const row = squadData as AnyRow;
      await (supabase as any).from('squad_members').insert({
        squad_id: row.id,
        user_id: userId,
        role: 'owner',
        can_roast: true,
        can_view_purchases: true,
      });

      return { data: mapSquad(row, []), error: null };
    } catch (err) {
      return { data: null, error: String(err) };
    }
  }

  // ── Join by invite code ────────────────────────────────────────────────

  static async joinByInviteCode(inviteCode: string, userId: string): Promise<ServiceResult<Squad>> {
    try {
      const { data: squadData, error: findError } = await supabase
        .from('squads')
        .select('*')
        .eq('invite_code', inviteCode.toUpperCase().trim())
        .single();

      if (findError || !squadData) return { data: null, error: 'Squad not found. Check the invite code.' };

      const squad = squadData as AnyRow;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: existing } = await (supabase as any)
        .from('squad_members')
        .select('user_id')
        .eq('squad_id', squad.id as string)
        .eq('user_id', userId)
        .single();

      if (existing) return { data: null, error: "You're already in this squad." };

      await (supabase as any).from('squad_members').insert({
        squad_id: squad.id,
        user_id: userId,
        role: 'member',
        can_roast: true,
        can_view_purchases: false,
      });

      const members = await SquadService.getMembers(squad.id as string);
      return { data: mapSquad(squad, members), error: null };
    } catch (err) {
      return { data: null, error: String(err) };
    }
  }

  // ── Get user's squads ─────────────────────────────────────────────────

  static async getUserSquads(userId: string): Promise<ServiceResult<Squad[]>> {
    try {
      const { data: memberships, error } = await supabase
        .from('squad_members')
        .select('squad_id')
        .eq('user_id', userId);

      if (error) return { data: [], error: error.message };
      if (!memberships?.length) return { data: [], error: null };

      const squadIds = memberships.map((m: AnyRow) => m.squad_id as string);
      const { data: squadsData, error: squadsError } = await supabase
        .from('squads')
        .select('*')
        .in('id', squadIds);

      if (squadsError) return { data: [], error: squadsError.message };

      const result = await Promise.all(
        (squadsData ?? []).map(async (sq: AnyRow) => {
          const members = await SquadService.getMembers(sq.id as string);
          return mapSquad(sq, members);
        })
      );
      return { data: result, error: null };
    } catch (err) {
      return { data: [], error: String(err) };
    }
  }

  // ── Members ────────────────────────────────────────────────────────────

  static async getMembers(squadId: string): Promise<SquadMember[]> {
    try {
      const { data } = await supabase
        .from('squad_members')
        .select('user_id, role, can_roast, can_view_purchases, joined_at')
        .eq('squad_id', squadId);

      return (data ?? []).map((m: AnyRow) => ({
        userId: m.user_id as string,
        displayName: 'Member',   // fetched separately to avoid join complexity
        avatarUrl: null,
        role: m.role as 'owner' | 'member',
        joinedAt: m.joined_at as string,
        canRoast: m.can_roast as boolean,
        canViewPurchases: m.can_view_purchases as boolean,
      }));
    } catch {
      return [];
    }
  }

  static async removeMember(squadId: string, targetUserId: string, requestingUserId: string): Promise<ServiceResult<void>> {
    try {
      const { data: requester } = await supabase
        .from('squad_members').select('role')
        .eq('squad_id', squadId).eq('user_id', requestingUserId).single();

      const canRemove = requestingUserId === targetUserId || (requester as AnyRow | null)?.role === 'owner';
      if (!canRemove) return { data: null, error: 'Not authorized to remove this member.' };

      await (supabase as any).from('squad_members').delete()
        .eq('squad_id', squadId).eq('user_id', targetUserId);
      return { data: undefined, error: null };
    } catch (err) {
      return { data: null, error: String(err) };
    }
  }

  // ── Messages ───────────────────────────────────────────────────────────

  static async getMessages(squadId: string, limit = 50): Promise<ServiceResult<SquadMessage[]>> {
    try {
      const { data, error } = await supabase
        .from('squad_messages')
        .select('id, squad_id, user_id, purchase_id, content, type, created_at')
        .eq('squad_id', squadId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) return { data: [], error: error.message };

      const messages = (data ?? []).reverse().map((m: AnyRow) => ({
        id: m.id as string,
        squadId: m.squad_id as string,
        userId: m.user_id as string,
        purchaseId: m.purchase_id as string | null,
        content: m.content as string,
        type: m.type as 'roast' | 'support' | 'system',
        createdAt: m.created_at as string,
        author: { displayName: 'Member', avatarUrl: null },
      }));
      return { data: messages, error: null };
    } catch (err) {
      return { data: [], error: String(err) };
    }
  }

  static async sendMessage(
    squadId: string, userId: string, content: string,
    type: 'roast' | 'support', purchaseId?: string
  ): Promise<ServiceResult<SquadMessage>> {
    try {
      const trimmed = content.trim();
      if (!trimmed || trimmed.length > 500) return { data: null, error: 'Message must be 1–500 characters.' };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('squad_messages')
        .insert({ squad_id: squadId, user_id: userId, content: trimmed, type, purchase_id: purchaseId ?? null })
        .select('id, squad_id, user_id, purchase_id, content, type, created_at')
        .single();

      if (error || !data) return { data: null, error: error?.message ?? 'Failed to send' };

      const m = data as AnyRow;
      return {
        data: {
          id: m.id as string, squadId: m.squad_id as string, userId: m.user_id as string,
          purchaseId: m.purchase_id as string | null, content: m.content as string,
          type: m.type as 'roast' | 'support' | 'system', createdAt: m.created_at as string,
          author: { displayName: 'Member', avatarUrl: null },
        },
        error: null,
      };
    } catch (err) {
      return { data: null, error: String(err) };
    }
  }

  static async deleteMessage(messageId: string, userId: string): Promise<ServiceResult<void>> {
    try {
      const { error } = await supabase
        .from('squad_messages')
        .delete()
        .eq('id', messageId)
        .eq('user_id', userId); // RLS policy also enforces this
      if (error) return { data: null, error: error.message };
      return { data: undefined, error: null };
    } catch (err) {
      return { data: null, error: String(err) };
    }
  }

  // ── Realtime ───────────────────────────────────────────────────────────

  static subscribeToMessages(squadId: string, onMessage: (message: SquadMessage) => void): () => void {
    const channel = supabase
      .channel(`squad-messages-${squadId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'squad_messages',
        filter: `squad_id=eq.${squadId}`,
      }, async (payload) => {
        const { data } = await supabase
          .from('squad_messages')
          .select('id, squad_id, user_id, purchase_id, content, type, created_at')
          .eq('id', (payload.new as AnyRow).id as string)
          .single();
        if (data) {
          const m = data as AnyRow;
          onMessage({
            id: m.id as string, squadId: m.squad_id as string, userId: m.user_id as string,
            purchaseId: m.purchase_id as string | null, content: m.content as string,
            type: m.type as 'roast' | 'support' | 'system', createdAt: m.created_at as string,
            author: { displayName: 'Member', avatarUrl: null },
          });
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }

  // ── Delete squad ───────────────────────────────────────────────────────

  static async deleteSquad(squadId: string, userId: string): Promise<ServiceResult<void>> {
    try {
      const { data: squad } = await (supabase as any).from('squads').select('owner_id').eq('id', squadId).single();
      if (!squad || (squad as AnyRow).owner_id !== userId) {
        return { data: null, error: 'Only the squad owner can delete the squad.' };
      }
      await (supabase as any).from('squads').delete().eq('id', squadId);
      return { data: undefined, error: null };
    } catch (err) {
      return { data: null, error: String(err) };
    }
  }
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const part = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `PAUSE-${part}`;
}

function mapSquad(data: AnyRow, members: SquadMember[]): Squad {
  const settings = (typeof data.settings === 'object' && data.settings !== null) ? data.settings as Record<string, unknown> : {};
  return {
    id: data.id as string,
    name: data.name as string,
    ownerId: data.owner_id as string,
    inviteCode: data.invite_code as string,
    members,
    settings: {
      alertOnSpendingLimit: (settings.alertOnSpendingLimit as boolean) ?? true,
      alertThreshold: (settings.alertThreshold as number) ?? 80,
      autoRoastEnabled: (settings.autoRoastEnabled as boolean) ?? false,
      privacyLevel: (settings.privacyLevel as 'all' | 'limits_only' | 'none') ?? 'limits_only',
    },
    createdAt: data.created_at as string,
  };
}
