import * as React from 'react'

export function getComponentName(Component: React.AbstractComponent) {
    return Component.displayName || Component.name || 'Component';
}
