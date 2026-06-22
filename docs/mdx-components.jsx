import { useMDXComponents as getThemeComponents } from 'nextra-theme-docs'

// Lấy các component mặc định của theme docs
const themeComponents = getThemeComponents()

// Merge components
export function useMDXComponents(components) {
  return {
    ...themeComponents,
    ...components
  }
}
