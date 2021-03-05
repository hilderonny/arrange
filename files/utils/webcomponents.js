/**
 * Web component framework
 */

 async function loadComponent(componentName) {
    const componentBaseUrl = `/components/${componentName}/${componentName}`;
    const htmlContent = await loadTextFile(`${componentBaseUrl}.html`);
    const jsContent = await loadTextFile(`${componentBaseUrl}.js`);
    const cssContent = await loadTextFile(`${componentBaseUrl}.css`);
    try {
        const moduleContent = await import(`${componentBaseUrl}.js`);
        console.log(moduleContent);
        customElements.define(componentName, moduleContent.default);
    } catch (_) {
        // Module class cannot be loaded, so create ony by outselves
        customElements.define(componentName, createEmptyComponent(htmlContent, cssContent));
    }
}

function createEmptyComponent(htmlContent, cssContent) {
    return class extends HTMLElement {
        constructor() {
            super();
            const shadowRoot = this.attachShadow({mode: 'open'});
            if (htmlContent) shadowRoot.innerHTML = htmlContent;
            if (cssContent) {
                const style = document.createElement('style');
                style.textContent = cssContent;
                shadowRoot.appendChild(style);
            }
        }
    };
}

async function loadTextFile(fileUrl) {
    const response = await fetch(fileUrl);
    if (response.status !== 200) {
        return undefined;
    } else {
        return await response.text();
    }
}

class WebComponent {
    
}


export {
    loadComponent
}