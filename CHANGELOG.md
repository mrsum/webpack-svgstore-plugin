### 4.1.0

- Implement `hash` by svg sprite content

### 4.0.3

- Adding `ready` helper, fixes DOMContentLoaded & script race condition

### 4.0.2

- Insert sprite on DOMContentLoaded

### 4.0.1

- Fix missing sprite variables

### 4.0.0

- Support webpack v2

### 3.0.6

- Update dependencies to last versions

### 3.0.2

- Minor readme change
- Logo change

### 3.0.1

- Long term caching

### 3.0.0

Attention! Major release!
- Change Initialize logic
- One instance for many sprites
- Compiling via special mark variavle like ```__svg__```

### 2.2.2

- Add default`xmlns:xlink` attribute to result svg

### 2.2.1

- Use new ConcatSource dependency for webpack 2.x

### 2.2.0

- Add `template` option for custom jade layout
- Add file caching to fix multiple sprite creation
- Use `emit` instead `compilation` state for comfortable work in devmode

### 2.1.5

- Change `glob` with `globby` to support multiple patterns

### 2.0.3 - 2.1.4

- Сhanges during this period have been lost and forgotten :'(

### 2.0.2 Global refactoring

- Move deprecated cheerio parsing to hell
- Performance optimization
- Remove some magic initial params from plugin init config
- SVG sprite file creating from JADE template engine
- SVGxhr.js more comfortable right now