import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';

export default function TabLayout() {

  return (
    <NativeTabs
      blurEffect="systemMaterial"
      minimizeBehavior="onScrollDown"
    >
      {/* Hidden index route */}
      <NativeTabs.Trigger name="index" hidden />

      {/* Left-grouped tabs */}
      <NativeTabs.Trigger name="review">
        <Icon sf="rectangle.stack.fill" />
        <Label>Reviews</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="session">
        <Icon sf="timer" />
        <Label>Session</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="stats/index">
        <Icon sf="chart.bar.fill" />
        <Label>Stats</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="settings">
        <Icon sf="gearshape.fill" />
        <Label>Settings</Label>
      </NativeTabs.Trigger>

      {/* Right-floating search button */}
      <NativeTabs.Trigger
        name="dictionary/index"
        role="search"
        options={{
          title: 'Dictionary',
        }}
      />
    </NativeTabs>
  );
}
