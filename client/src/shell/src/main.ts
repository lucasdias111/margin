import { mount } from 'svelte'
import './shell.css'
import App from './App.svelte'

mount(App, { target: document.getElementById('app')! })
