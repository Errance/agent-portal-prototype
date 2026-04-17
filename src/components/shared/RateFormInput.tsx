import { Box, Text } from '@chakra-ui/react'

interface Props {
  label: string
  value: string
  onChange: (v: string) => void
  step: string
  error?: string
  extra?: string
}

/**
 * InvitePromotion / FriendsCenter 修改比例弹窗共用的比例输入框。
 */
export default function RateFormInput({ label, value, onChange, step, error, extra }: Props) {
  return (
    <Box>
      <Text fontSize="12px" color="gray.100" mb="8px" textTransform="uppercase" letterSpacing="0.5px">
        {label}{extra && <Text as="span" color="gray.200"> {extra}</Text>}
      </Text>
      <Box
        as="input"
        w="100%"
        h="40px"
        bg="bg.200"
        border="1px solid"
        borderColor={error ? 'red.100' : 'border.100'}
        borderRadius="4px"
        px={3}
        fontSize="14px"
        color="text.100"
        outline="none"
        type="number"
        step={step}
        value={value}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
        transition="all 0.2s"
        _focus={{
          borderColor: error ? 'red.100' : 'theme',
          boxShadow: error ? 'none' : '0 0 0 1px rgba(10,186,181,0.5)',
        }}
      />
      {error && <Text fontSize="12px" color="red.100" mt="4px">{error}</Text>}
    </Box>
  )
}
