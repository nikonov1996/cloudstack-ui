import { createFeatureSelector, createSelector } from '@ngrx/store';
import { Route } from '../models';
import { appNavRoutes } from '../routes';
import { getUrl } from '../../../root-store/router/router.selectors';
const flatten = require('lodash/flatten');
import { get } from '../../../root-store/config/config.selectors';
import { selectIsAdminResourceQuotasEnabled } from '../../../resource-quotas/redux/selectors/is-admin-resource-quotas-enabled.selector';

export interface State {
  routes: Route[];
}

export const initialState: State = {
  routes: appNavRoutes,
};

export function reducer(state = initialState, action: any): State {
  switch (action.type) {
    default: {
      return state;
    }
  }
}

const vmLogsSubroute = {
  text: 'NAVIGATION_SIDEBAR.LOGS',
  path: '/logs',
  icon: 'mdi-text',
  routeId: 'virtual-machines',
};

const resourceQuotasSubroute = {
  text: 'NAVIGATION_SIDEBAR.RESOURCE_QUOTAS',
  path: '/resource-quotas',
  icon: 'mdi-tune',
  routeId: 'accounts',
};

export const getNavMenuState = createFeatureSelector<State>('navMenu');

export const getRoutes = createSelector(
  getNavMenuState,
  state => state.routes,
);

const getCurrentSubroutePath = createSelector(
  getUrl,
  url => url.match(/^\/[A-Za-z-]*/)[0],
);

const getAllSubroutes = createSelector(
  getRoutes,
  get('extensions'),
  selectIsAdminResourceQuotasEnabled,
  (routes, { vmLogs }, isAdminResourceQuotasEnabled) => {
    const subroutes = flatten(routes.map(route => route.subroutes));

    if (vmLogs) {
      subroutes.push(vmLogsSubroute);
    }

    if (isAdminResourceQuotasEnabled) {
      subroutes.push(resourceQuotasSubroute);
    }

    return subroutes;
  },
);

const getCurrentSubroute = createSelector(
  getCurrentSubroutePath,
  getAllSubroutes,
  (path, subroutes) => subroutes.find(subroute => subroute && subroute.path === path),
);

export const getCurrentRoute = createSelector(
  getRoutes,
  getCurrentSubroute,
  (routes, subroute) => routes.find(route => subroute && route.id === subroute.routeId),
);

export const getSubroutes = createSelector(
  getCurrentRoute,
  get('extensions'),
  selectIsAdminResourceQuotasEnabled,
  (route, { vmLogs }, isAdminResourceQuotasEnabled) => {
    // todo: replace with plugin system
    if (!route) {
      return [];
    }

    if (route.id === 'virtual-machines' && vmLogs) {
      return route.subroutes.concat(vmLogsSubroute);
    }

    if (route.id === 'accounts' && isAdminResourceQuotasEnabled) {
      return [route.subroutes[0], resourceQuotasSubroute, ...route.subroutes.slice(1)];
    }

    return route.subroutes;
  },
);
