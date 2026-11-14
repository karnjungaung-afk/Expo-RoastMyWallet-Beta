import { Tabs } from 'expo-router/js-tabs';
import { FloatingTabBar } from '@/components/ui/FloatingTabBar';

export default function TabLayout() {
  return (
    <Tabs
      tabBar={props => <FloatingTabBar {...props} />}
      screenOptions={{ headerShown: false, tabBarHideOnKeyboard: true }}
    >
      <Tabs.Screen name="index" options={{ title: 'หน้าหลัก' }} />
      <Tabs.Screen name="waiting" options={{ title: 'รอซื้อ' }} />
      <Tabs.Screen name="insights" options={{ title: 'วิเคราะห์' }} />
      <Tabs.Screen name="squad" options={{ title: 'สควอด' }} />
      <Tabs.Screen name="profile" options={{ title: 'โปรไฟล์' }} />
    </Tabs>
  );
}
