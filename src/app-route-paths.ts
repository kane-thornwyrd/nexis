const ADMIN_ROUTE_BASE_PATH = "/admin";
const OVERLAY_ROUTE_BASE_PATH = `${ADMIN_ROUTE_BASE_PATH}/overlay`;
const ADMIN_OVERLAY_STUDIO_BASE_PATH = `${OVERLAY_ROUTE_BASE_PATH}/edit`;
const RENDER_ROUTE_BASE_PATH = "/render";
const STAGING_ROUTE_BASE_PATH = "/staging";

const buildServerPath = (basePath: string) => `${basePath}/*`;

const buildOverlayPath = (basePath: string, overlayId: string) =>
	`${basePath}/${overlayId}`;

export const APP_ROOT_PATH = "/";
export const ADMIN_SURFACE_PATH = ADMIN_ROUTE_BASE_PATH;
export const ADMIN_SURFACE_SERVER_PATH = buildServerPath(ADMIN_ROUTE_BASE_PATH);
export const ADMIN_HOME_PATH = `${ADMIN_ROUTE_BASE_PATH}/start`;
export const ADMIN_SETTINGS_PATH = `${ADMIN_ROUTE_BASE_PATH}/settings`;
export const ADMIN_PLUGINS_PATH = `${ADMIN_ROUTE_BASE_PATH}/plugins`;
export const ADMIN_PERMISSIONS_PATH = `${ADMIN_ROUTE_BASE_PATH}/permissions`;
export const ADMIN_OVERLAY_MANAGER_PATH = OVERLAY_ROUTE_BASE_PATH;
export const ADMIN_OVERLAY_STUDIO_CLIENT_PATH =
	`${ADMIN_OVERLAY_STUDIO_BASE_PATH}/:overlayId`;
export const ADMIN_DATA_PATH = `${ADMIN_ROUTE_BASE_PATH}/data`;
export const ADMIN_LOG_PATH = `${ADMIN_ROUTE_BASE_PATH}/log`;
export const ADMIN_ARTS_PATH = `${ADMIN_ROUTE_BASE_PATH}/arts`;

export const RENDER_SURFACE_CLIENT_PATH = `${RENDER_ROUTE_BASE_PATH}/:overlayId`;
export const RENDER_SURFACE_SERVER_PATH = buildServerPath(RENDER_ROUTE_BASE_PATH);
export const STAGING_SURFACE_CLIENT_PATH =
	`${STAGING_ROUTE_BASE_PATH}/:overlayId`;
export const STAGING_SURFACE_SERVER_PATH = buildServerPath(STAGING_ROUTE_BASE_PATH);

export const buildAdminOverlayStudioPath = (overlayId: string) =>
	buildOverlayPath(ADMIN_OVERLAY_STUDIO_BASE_PATH, overlayId);

export const buildRenderSurfacePath = (overlayId: string) =>
	buildOverlayPath(RENDER_ROUTE_BASE_PATH, overlayId);

export const buildStagingSurfacePath = (overlayId: string) =>
	buildOverlayPath(STAGING_ROUTE_BASE_PATH, overlayId);
