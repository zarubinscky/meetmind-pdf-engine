/*
 * MeetMind AI
 * Executive Slide Engine
 *
 * Design System
 *
 * Single source of visual tokens for the PDF Engine.
 *
 * This module contains no:
 * - user-facing strings;
 * - localization dictionaries;
 * - business logic;
 * - block priorities;
 * - pagination rules;
 * - content limits;
 * - renderer functions;
 * - SVG data.
 *
 * Public contract:
 *
 * ExecutiveSlideEngine.design.TOKENS
 * ExecutiveSlideEngine.design.getDensityTokens(density)
 * ExecutiveSlideEngine.design.getTextStyle(role, density)
 */

(function initializeDesignSystem(global) {
    'use strict';

    const engine = global.ExecutiveSlideEngine || {};

    const TOKENS = deepFreeze({
        page: {
            width: 842,
            height: 595,

            margin: {
                top: 32,
                right: 32,
                bottom: 32,
                left: 32
            },

            background: 'pageBackground'
        },

        colors: {
            pageBackground: [1.00, 1.00, 1.00],
            cardBackground: [0.985, 0.985, 0.985],
            serviceBackground: [1.00, 1.00, 1.00],
            cardBorder: [0.88, 0.88, 0.88],
            title: [0.12, 0.12, 0.12],
            body: [0.22, 0.22, 0.22],
            secondary: [0.50, 0.50, 0.50],
            accent: [0.12, 0.47, 0.92],
            white: [1.00, 1.00, 1.00]
        },

        typography: {
            families: {
                regular: 'regular',
                bold: 'bold'
            },

            headerTitle: {
                font: 'bold',
                size: 20,
                lineHeight: 23,
                color: 'title'
            },

            headerSubtitle: {
                font: 'regular',
                size: 9,
                lineHeight: 12,
                color: 'secondary'
            },

            small: {
                font: 'regular',
                size: 7.5,
                lineHeight: 9.5,
                color: 'secondary'
            },

            metricValue: {
                font: 'bold',
                size: 18,
                lineHeight: 20,
                color: 'title'
            },

            metricLabel: {
                font: 'regular',
                size: 7,
                lineHeight: 9,
                color: 'secondary'
            },

            hierarchy: {
                primary: {
                    title: {
                        font: 'bold',
                        size: 12,
                        lineHeight: 14,
                        color: 'title'
                    },

                    body: {
                        font: 'regular',
                        size: 9,
                        lineHeight: 11.5,
                        color: 'body'
                    },

                    secondary: {
                        font: 'regular',
                        size: 8,
                        lineHeight: 11.5,
                        color: 'secondary'
                    }
                },

                core: {
                    title: {
                        font: 'bold',
                        size: 10.5,
                        lineHeight: 12.5,
                        color: 'title'
                    },

                    body: {
                        font: 'regular',
                        size: 8,
                        lineHeight: 10.5,
                        color: 'body'
                    },

                    secondary: {
                        font: 'regular',
                        size: 7,
                        lineHeight: 10.5,
                        color: 'secondary'
                    }
                },

                supporting: {
                    title: {
                        font: 'bold',
                        size: 9.5,
                        lineHeight: 11.5,
                        color: 'title'
                    },

                    body: {
                        font: 'regular',
                        size: 7.5,
                        lineHeight: 9.5,
                        color: 'body'
                    },

                    secondary: {
                        font: 'regular',
                        size: 6.5,
                        lineHeight: 9.5,
                        color: 'secondary'
                    }
                },

                service: {
                    title: {
                        font: 'bold',
                        size: 8.5,
                        lineHeight: 10.5,
                        color: 'title'
                    },

                    body: {
                        font: 'regular',
                        size: 7,
                        lineHeight: 9,
                        color: 'body'
                    },

                    secondary: {
                        font: 'regular',
                        size: 6,
                        lineHeight: 9,
                        color: 'secondary'
                    }
                },

                document: {
                    title: {
                        font: 'bold',
                        size: 10,
                        lineHeight: 12,
                        color: 'title'
                    },

                    body: {
                        font: 'regular',
                        size: 8,
                        lineHeight: 10,
                        color: 'body'
                    },

                    secondary: {
                        font: 'regular',
                        size: 7,
                        lineHeight: 10,
                        color: 'secondary'
                    }
                }
            }
        },

        spacing: {
            blockGap: 16,
            cardPadding: 10,
            titleGap: 6,
            paragraphGap: 5,
            bulletGap: 3,
            metricGap: 6,
            headerTitleToSubtitle: 3,
            footerTopPadding: 6
        },

        borders: {
            card: {
                width: 0.75,
                radius: 0,
                color: 'cardBorder'
            },

            nestedCard: {
                width: 0.5,
                radius: 0,
                color: 'cardBorder'
            },

            divider: {
                width: 0.6,
                color: 'cardBorder'
            }
        },

        bullets: {
            radius: 1.4,
            indent: 9,
            verticalAlignmentFactor: 0.45,
            color: 'accent'
        },

        icons: {
            small: 9,
            medium: 12,
            large: 16,
            gap: 4
        },

        cards: {
            default: {
                background: 'cardBackground',
                border: 'card'
            },

            service: {
                background: 'serviceBackground',
                border: 'card'
            },

            compactGridItem: {
                background: 'pageBackground',
                border: 'nestedCard',
                paddingX: 4,
                paddingTop: 3,
                columnGap: 5,
                rowGap: 4
            },
        },

        tables: {
            threeColumnTable: {
                columnGap: 10,
                secondColumnMinWidth: 50,
                thirdColumnMinWidth: 45,
                cellHorizontalPadding: 10,
                headerHeight: 12
            }
        },

        density: {
            regular: {
                typographyScale: 1,
                lineHeightScale: 1,
                spacingScale: 1,
                iconScale: 1
            }
        }
    });

    function getDensityTokens(density) {
        const normalizedDensity = normalizeDensity(density);

        return TOKENS.density[normalizedDensity];
    }

    function getTextStyle(role, density) {
        const normalizedRole = normalizeTextRole(role);
        const normalizedDensity = normalizeDensity(density);
        const densityTokens = TOKENS.density[normalizedDensity];
        const source = TOKENS.typography.hierarchy[normalizedRole];

        return deepFreeze({
            role: normalizedRole,
            density: normalizedDensity,

            title: scaleTextStyle(
                source.title,
                densityTokens
            ),

            body: scaleTextStyle(
                source.body,
                densityTokens
            ),

            secondary: scaleTextStyle(
                source.secondary,
                densityTokens
            )
        });
    }

    function normalizeDensity(density) {
        if (
            typeof density === 'string' &&
            Object.prototype.hasOwnProperty.call(
                TOKENS.density,
                density
            )
        ) {
            return density;
        }

        warn(
            'Unknown density token. Falling back to regular.',
            density
        );

        return 'regular';
    }

    function normalizeTextRole(role) {
        if (
            typeof role === 'string' &&
            Object.prototype.hasOwnProperty.call(
                TOKENS.typography.hierarchy,
                role
            )
        ) {
            return role;
        }

        warn(
            'Unknown text role. Falling back to core.',
            role
        );

        return 'core';
    }

    function warn(message, value) {
        if (typeof engine.diagnostics === 'function') {
            engine.diagnostics({
                source: 'design-system',
                level: 'warn',
                message,
                value
            });

            return;
        }

        if (
            engine.debug === true &&
            global.console &&
            typeof global.console.warn === 'function'
        ) {
            global.console.warn(
                `Executive Slide Engine: ${message}`,
                value
            );
        }
    }

    function scaleTextStyle(style, densityTokens) {
        return {
            font: style.font,

            size: roundToken(
                style.size *
                densityTokens.typographyScale
            ),

            lineHeight: roundToken(
                style.lineHeight *
                densityTokens.lineHeightScale
            ),

            color: style.color
        };
    }

    function roundToken(value) {
        return Math.round(value * 100) / 100;
    }

    function deepFreeze(value) {
        if (
            !value ||
            typeof value !== 'object' ||
            Object.isFrozen(value)
        ) {
            return value;
        }

        Object.getOwnPropertyNames(value)
            .forEach(propertyName => {
                deepFreeze(
                    value[propertyName]
                );
            });

        return Object.freeze(value);
    }

    engine.design = Object.freeze({
        TOKENS,
        getDensityTokens,
        getTextStyle
    });

    global.ExecutiveSlideEngine = engine;

})(window);
