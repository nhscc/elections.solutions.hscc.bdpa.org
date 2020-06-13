import * as React from 'react'

export function getComponentDisplayName(component: React.ComponentClass) {
    return component.displayName || component.name || 'Component';
}
