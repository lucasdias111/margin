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
  '/setup': wrap({
    asyncComponent: () => import('$src/routes/setup/+page.svelte')
  }),
  '/email-activation/:token': wrap({
    asyncComponent: () => import('$src/routes/email-activation/+page.svelte')
  }),
  '/reset-password/:token': wrap({
    asyncComponent: () => import('$src/routes/reset-password/+page.svelte')
  }),
  '/invite/:code': wrap({
    asyncComponent: () => import('$src/routes/invite/+page.svelte')
  }),
  '/meet/:code': wrap({
    asyncComponent: () => import('$src/routes/meet/+page.svelte')
  })
}
