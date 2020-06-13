import * as React from 'react'

export function getComponentName(component) {
    return component.displayName || component.name || 'Component';
}
