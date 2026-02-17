<script lang="ts">

import { getPicURL } from "$src/components/sidebar/sidebar_list/ProfileDisplay"
import type { User } from '$src/interfaces/User'

export let user: User | null

</script>

<div class="user-avatar">
<img class="pic"src={getPicURL(user)} alt={user.username} />
<p class="name">{user.username}</p>
</div>