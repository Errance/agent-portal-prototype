import { Flex, Text, type BoxProps } from '@chakra-ui/react'
import type { ReactNode } from 'react'

interface Props extends BoxProps {
  title: string
  subtitle?: string
  action?: ReactNode
}

export default function SectionHeader({ title, subtitle, action, ...rest }: Props) {
  return (
    <Flex justify="space-between" align="center" mb="24px" {...rest}>
      <Flex direction="column" gap="4px">
        <Text fontFamily="ISB" fontSize="20px" color="text.100" letterSpacing="-0.5px">
          {title}
        </Text>
        {subtitle && (
          <Text fontSize="13px" color="gray.200">{subtitle}</Text>
        )}
      </Flex>
      {action}
    </Flex>
  )
}
