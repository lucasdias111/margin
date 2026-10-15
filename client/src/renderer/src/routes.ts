import { wrap } from 'svelte-spa-router/wrap'

// @ts-ignore
export const routes = {
  '/': wrap({
    asyncComponent: () => import('$src/routes/+page.svelte')
  }),
  '/home': wrap({
    asyncComponent: () => import('$src/routes/home/+page.svelte')
  }),
  '/register': wrap({
    asyncComponent: () => import('$src/routes/register/+page.svelte')
  }),
  '/forgot-password': wrap({
    asyncComponent: () => import('$src/routes/forgot-password/+page.svelte')
  }),
  '/meet/:code': wrap({
    asyncComponent: () => import('$src/routes/meet/+page.svelte')
  })
}
