import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import { router } from './router'
import './styles/main.scss'

// Carbon Web Components self-register as custom elements on import.
// We import only what the scaffold renders today; further imports land in PR #3.
import '@carbon/web-components/es/components/ui-shell/header.js'
import '@carbon/web-components/es/components/ui-shell/header-name.js'
import '@carbon/web-components/es/components/ui-shell/header-global-action.js'
import '@carbon/web-components/es/components/icon-button/index.js'
import '@carbon/web-components/es/components/button/index.js'

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')
