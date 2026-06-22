import nextra from 'nextra'

const withNextra = nextra({
  // Cấu hình riêng của Nextra (nếu cần) đặt ở đây
})

export default withNextra({
  i18n: {
    locales: ['vi', 'en'],
    defaultLocale: 'vi'
  }
})
