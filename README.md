# Angular Code Builder

Write `<code><code>` in Angular templates in a declarartive way without caring about escaping special characters.

Usually in Angular templates you have to escape braces like `{` to `{{'{'}}` and `}` to `{{'}'}}` in the template, otherwise Angular throws an error.

The **Angular Code Builder** does this "annoying" escaping for you, at build time. 

### Usage
```bash
ng add angular-code-builder
```

Then you should be able to write code parts directly in your template file: 
```html
<pre><code>
function sharksAreComing() {
  console.log('Shark is coming..');
}
</code><pre>
```

Without Angular Code Builder you would have to write: 
```html
<pre><code>
function sharksAreComing() {{'{'}}
  console.log('Shark is coming..');
{{'}'}}
</code><pre>
```

### How does it work?
We are using a Angular Schematics to configure a custom webpack loader for `html` in which we search for `<code>` element and do the escaping automatically.

For the custom webpack configuration we use the custom webpack builder: https://www.npmjs.com/package/@angular-builders/custom-webpack
