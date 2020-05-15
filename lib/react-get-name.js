/* @flow */

import * as React from 'react'

export function getComponentName(Component: React.AbstractComponent<any>) {
    return Component.displayName || Component.name || 'Component';
}
