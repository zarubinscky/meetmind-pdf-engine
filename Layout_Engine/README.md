# MeetMind Layout Engine — Release 0.3

Статус: **Iteration 2 / адаптивная геометрия**

Этот релиз полностью заменяет `layout-engine.js` из Release 0.2.

## Реализовано

- шаблон `vertical-flow`;
- шаблон `balanced`;
- `dominant-insights`;
- `dominant-decisions`;
- `dominant-risks`;
- двухколоночная геометрия;
- увеличенная колонка доминирующего блока;
- автоматическое распределение блоков между колонками;
- `Tasks + Architecture` side-by-side, если пара помещается;
- density fallback:
  - regular;
  - compact;
  - dense;
  - truncated;
- сохранение diagnostics и validation;
- неизвестный template безопасно переключается на `vertical-flow`.

## Важное ограничение

Layout Engine не переносит блоки между страницами. Этим управляет Composition Engine.
Layout Engine только сообщает об остаточном overflow после всех допустимых density modes.

## Переопределение токенов

```js
const result = MeetMindLayoutEngine.layout(composition, {
  page: {
    width: 1600,
    height: 900,
    columnGap: 16
  },
  densityTokens: {
    compact: {
      tableRowHeight: 26
    }
  },
  enableDensityFallback: true
});
```

Числа внутри движка являются дефолтными design/layout tokens. На финальной ревизии они будут синхронизированы с `design-system.js`, чтобы исключить дублирование.

