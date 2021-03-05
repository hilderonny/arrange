/**
 * Web component framework
 */

 async function loadComponent(componentName) {
    const componentBaseUrl = `/components/${componentName}/${componentName}`;
    const htmlContent = await loadTextFile(`${componentBaseUrl}.html`);
    const cssContent = await loadTextFile(`${componentBaseUrl}.css`);
    try {
        const moduleContent = await import(`${componentBaseUrl}.js`);
        const cls = class extends moduleContent.default {
            constructor() {
                super();
                if (htmlContent) this.html = htmlContent;
                if (cssContent) this.css = cssContent;
            }
        }
        customElements.define(componentName, cls);
    } catch (_) {
        // Module class cannot be loaded, so create ony by outselves
        customElements.define(componentName, createEmptyComponent(htmlContent, cssContent));
    }
}

function createEmptyComponent(htmlContent, cssContent) {
    return class extends WebComponent {
        constructor() {
            super();
            if (htmlContent) this.html = htmlContent;
            if (cssContent) this.css = cssContent;
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

class WebComponent extends HTMLElement {

    constructor() {
        super();
        this.attachShadow({mode: 'open'});
        this.htmlContent = '';
        this.cssContent = '';
    }

    set html(content) {
        this.htmlContent = content;
        this.updateContent();
    }

    set css(content) {
        this.cssContent = `<style>${content}</style>`;
        this.updateContent();
    }

    updateContent() {
        const replacedContent = this.htmlContent.replace(/\{(.*?)\}/g, (_, matchedText) => {
            const property = this[matchedText];
            if (typeof(property) === 'function') {
                return `this.getRootNode().host.${matchedText}();`;
            } else {
                return property;
            }
        });
        this.shadowRoot.innerHTML = this.cssContent + replacedContent;
    }

}

export {
    loadComponent,
    WebComponent
}