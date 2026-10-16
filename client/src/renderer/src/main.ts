import { mount } from 'svelte'
import './app.css'

import App from './App.svelte'
import { hashRouteForPath } from '$src/utils/pathRoute'

const hashRoute = hashRouteForPath(location.pathname, location.search, location.hash)
if (hashRoute) history.replaceState(null, '', hashRoute)

const app = mount(App, {
  target: document.getElementById('app')!
})

export default app
