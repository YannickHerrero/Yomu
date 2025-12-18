import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { Center } from '@/components/ui/center';

export default function StatsScreen() {
  return (
    <Box className="flex-1 bg-background-0">
      <Center className="flex-1">
        <Text className="text-typography-500">Statistics</Text>
      </Center>
    </Box>
  );
}
