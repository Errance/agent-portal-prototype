import { chakra } from '@chakra-ui/react'
import { Link as RouterLink } from 'react-router-dom'

/**
 * 本文件统一收敛 `Box as="xxx"` 造成的 Chakra v3 polymorphic prop 推断丢失问题
 * （`type`/`value`/`href`/`to` 等 HTML/Link 原生属性无法通过 polymorphic as 传下去）。
 *
 * 用法：
 *   ```tsx
 *   <ChakraInput type="number" value={v} onChange={...} bg="bg.200" ... />
 *   <ChakraLink to="/revenue" bg="theme" color="#FFFFFF">...</ChakraLink>
 *   ```
 */
export const ChakraInput = chakra('input')
export const ChakraSelect = chakra('select')
export const ChakraAnchor = chakra('a')
export const ChakraLabel = chakra('label')
export const ChakraLink = chakra(RouterLink)
