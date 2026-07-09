import { cache } from 'react';

import { fetchUserAccountSidebar } from '../../infrastructure/clients/account-sidebar.client';

export const getUserAccountSidebarQuery = cache(fetchUserAccountSidebar);
