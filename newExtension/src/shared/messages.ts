/** Chrome runtime message types (extension pages ↔ background). */
export const MSG = {
  GET_STATUS: 'webchat/getStatus',
  PREPARE_SIDEPANEL: 'webchat/prepareSidepanel',
  GET_INITIAL_PREFIX: 'webchat/getInitialPrefix',
} as const;
