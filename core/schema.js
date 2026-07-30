/*
 * MeetMind AI
 * Executive Slide Engine
 *
 * Executive Report Schema v1.0
 *
 * Single source of truth for the Executive Report data contract.
 *
 * This module contains no:
 * - normalization;
 * - defaults;
 * - data correction;
 * - presentation logic;
 * - localization;
 * - renderer logic;
 * - layout logic;
 * - external dependencies.
 *
 * Public contract:
 *
 * ExecutiveSlideEngine.schema.version
 * ExecutiveSlideEngine.schema.validate(report)
 */

(function initializeSchema(global) {
    'use strict';

    const engine = global.ExecutiveSlideEngine || {};
    const VERSION = '1.0.0';

    const ERROR_CODES = deepFreeze({
        REQUIRED: 'required',
        TYPE: 'type',
        UNKNOWN_PROPERTY: 'unknown_property',
        CYCLIC_REFERENCE: 'cyclic_reference',
        UNKNOWN_REFERENCE: 'unknown_reference'
    });

    const DEFINITIONS = deepFreeze({
        version: VERSION,
        textItem: {
            type: 'object',
            required: ['title'],
            additionalProperties: false,
            properties: {
                title: {
                    type: 'string'
                },
                description: {
                    type: 'string'
                }
            }
        },

        task: {
            type: 'object',
            required: ['task'],
            additionalProperties: false,
            properties: {
                task: {
                    type: 'string'
                },
                owner: {
                    type: 'string'
                },
                dueDate: {
                    type: 'string'
                },
                status: {
                    type: 'string'
                },
                priority: {
                    type: 'string'
                }
            }
        },

        owner: {
            type: 'object',
            required: ['name'],
            additionalProperties: false,
            properties: {
                name: {
                    type: 'string'
                },
                role: {
                    type: 'string'
                }
            }
        },

        participant: {
            type: 'object',
            required: ['name'],
            additionalProperties: false,
            properties: {
                name: {
                    type: 'string'
                },
                role: {
                    type: 'string'
                }
            }
        },

        architectureItem: {
            type: 'object',
            required: ['title'],
            additionalProperties: false,
            properties: {
                title: {
                    type: 'string'
                },
                description: {
                    type: 'string'
                }
            }
        },

        metric: {
            type: 'object',
            required: [
                'label',
                'value'
            ],
            additionalProperties: false,
            properties: {
                label: {
                    type: 'string'
                },
                value: {
                    type: [
                        'string',
                        'number'
                    ]
                }
            }
        },

        stats: {
            type: 'object',
            additionalProperties: {
                type: [
                    'string',
                    'number',
                    'boolean'
                ]
            },
            properties: {}
        },

        report: {
            type: 'object',
            required: ['title'],
            additionalProperties: false,
            properties: {
                title: {
                    type: 'string'
                },
                subtitle: {
                    type: 'string'
                },
                meetingDate: {
                    type: 'string'
                },
                summary: {
                    type: 'string'
                },
                decisions: {
                    type: 'array',
                    items: {
                        type: [
                            'string',
                            'reference'
                        ],
                        reference: 'textItem'
                    }
                },
                tasks: {
                    type: 'array',
                    items: {
                        type: 'reference',
                        reference: 'task'
                    }
                },
                risks: {
                    type: 'array',
                    items: {
                        type: [
                            'string',
                            'reference'
                        ],
                        reference: 'textItem'
                    }
                },
                insights: {
                    type: 'array',
                    items: {
                        type: [
                            'string',
                            'reference'
                        ],
                        reference: 'textItem'
                    }
                },
                owners: {
                    type: 'array',
                    items: {
                        type: [
                            'string',
                            'reference'
                        ],
                        reference: 'owner'
                    }
                },
                participants: {
                    type: 'array',
                    items: {
                        type: [
                            'string',
                            'reference'
                        ],
                        reference: 'participant'
                    }
                },
                architecture: {
                    type: 'array',
                    items: {
                        type: [
                            'string',
                            'reference'
                        ],
                        reference: 'architectureItem'
                    }
                },
                metrics: {
                    type: 'array',
                    items: {
                        type: 'reference',
                        reference: 'metric'
                    }
                },
                transcript: {
                    type: 'string'
                },
                stats: {
                    type: 'reference',
                    reference: 'stats'
                }
            }
        }
    });

    /**
     * Validates an Executive Report without changing the input.
     *
     * Validation failures are returned as data and are never thrown
     * as part of the normal validation flow.
     *
     * @param {*} report
     * @returns {{valid: boolean, errors: Array<Object>}}
     */
    function validate(report) {
        const errors = [];
        const activeObjects = new WeakSet();

        validateValue(
            report,
            DEFINITIONS.report,
            '',
            errors,
            activeObjects
        );

        return {
            valid: errors.length === 0,
            errors
        };
    }

    function validateValue(
        value,
        definition,
        path,
        errors,
        activeObjects
    ) {
        const allowedTypes = toTypeList(
            definition.type
        );

        if (
            allowedTypes.includes('reference') &&
            matchesNonReferenceType(
                value,
                allowedTypes
            )
        ) {
            return;
        }

        if (
            allowedTypes.includes('reference')
        ) {
            const referencedDefinition =
                DEFINITIONS[
                    definition.reference
                ];

            if (!referencedDefinition) {
                errors.push({
                    path,
                    code: ERROR_CODES.UNKNOWN_REFERENCE,
                    reference: definition.reference
                });

                return;
            }

            validateValue(
                value,
                referencedDefinition,
                path,
                errors,
                activeObjects
            );

            return;
        }

        const matchingType =
            allowedTypes.find(
                type => matchesType(
                    value,
                    type
                )
            );

        if (!matchingType) {
            addTypeError(
                errors,
                path,
                formatExpectedTypes(
                    allowedTypes
                ),
                getActualType(value)
            );

            return;
        }

        if (
            matchingType === 'object'
        ) {
            validateObject(
                value,
                definition,
                path,
                errors,
                activeObjects
            );

            return;
        }

        if (
            matchingType === 'array'
        ) {
            validateArray(
                value,
                definition,
                path,
                errors,
                activeObjects
            );
        }
    }

    function validateObject(
        value,
        definition,
        path,
        errors,
        activeObjects
    ) {
        if (
            activeObjects.has(value)
        ) {
            errors.push({
                path,
                code: ERROR_CODES.CYCLIC_REFERENCE
            });

            return;
        }

        activeObjects.add(value);

        const properties =
            definition.properties || {};

        const required =
            definition.required || [];

        required.forEach(
            propertyName => {
                if (
                    !Object.prototype.hasOwnProperty.call(
                        value,
                        propertyName
                    )
                ) {
                    errors.push({
                        path: appendPropertyPath(
                            path,
                            propertyName
                        ),
                        code: ERROR_CODES.REQUIRED
                    });
                }
            }
        );

        Object.keys(value)
            .forEach(propertyName => {
                const propertyPath =
                    appendPropertyPath(
                        path,
                        propertyName
                    );

                if (
                    Object.prototype.hasOwnProperty.call(
                        properties,
                        propertyName
                    )
                ) {
                    validateValue(
                        value[propertyName],
                        properties[propertyName],
                        propertyPath,
                        errors,
                        activeObjects
                    );

                    return;
                }

                if (
                    definition.additionalProperties === false
                ) {
                    errors.push({
                        path: propertyPath,
                        code: ERROR_CODES.UNKNOWN_PROPERTY
                    });

                    return;
                }

                if (
                    isPlainObject(
                        definition.additionalProperties
                    )
                ) {
                    validateValue(
                        value[propertyName],
                        definition.additionalProperties,
                        propertyPath,
                        errors,
                        activeObjects
                    );
                }
            });

        activeObjects.delete(value);
    }

    function validateArray(
        value,
        definition,
        path,
        errors,
        activeObjects
    ) {
        if (
            activeObjects.has(value)
        ) {
            errors.push({
                path,
                code: ERROR_CODES.CYCLIC_REFERENCE
            });

            return;
        }

        activeObjects.add(value);

        if (definition.items) {
            value.forEach(
                (item, index) => {
                    validateValue(
                        item,
                        definition.items,
                        appendIndexPath(
                            path,
                            index
                        ),
                        errors,
                        activeObjects
                    );
                }
            );
        }

        activeObjects.delete(value);
    }

    function matchesNonReferenceType(
        value,
        types
    ) {
        return types
            .filter(
                type =>
                    type !==
                    'reference'
            )
            .some(
                type =>
                    matchesType(
                        value,
                        type
                    )
            );
    }

    function matchesType(
        value,
        type
    ) {
        switch (type) {
            case 'array':
                return Array.isArray(value);

            case 'object':
                return isPlainObject(value);

            case 'number':
                return (
                    typeof value === 'number' &&
                    Number.isFinite(value)
                );

            case 'string':
                return typeof value === 'string';

            case 'boolean':
                return typeof value === 'boolean';

            case 'null':
                return value === null;

            default:
                return false;
        }
    }

    function getActualType(value) {
        if (value === null) {
            return 'null';
        }

        if (Array.isArray(value)) {
            return 'array';
        }

        if (
            typeof value === 'number' &&
            !Number.isFinite(value)
        ) {
            return 'non_finite_number';
        }

        return typeof value;
    }

    function toTypeList(type) {
        return Array.isArray(type)
            ? type
            : [type];
    }

    function formatExpectedTypes(types) {
        return types
            .map(
                type =>
                    type === 'reference'
                        ? 'object'
                        : type
            )
            .filter(
                (type, index, list) =>
                    list.indexOf(type) ===
                    index
            )
            .join('|');
    }

    function addTypeError(
        errors,
        path,
        expected,
        actual
    ) {
        errors.push({
            path,
            code: ERROR_CODES.TYPE,
            expected,
            actual
        });
    }

    function appendPropertyPath(
        basePath,
        propertyName
    ) {
        return basePath
            ? `${basePath}.${propertyName}`
            : propertyName;
    }

    function appendIndexPath(
        basePath,
        index
    ) {
        return `${basePath}[${index}]`;
    }

    function isPlainObject(value) {
        if (
            !value ||
            typeof value !== 'object' ||
            Array.isArray(value)
        ) {
            return false;
        }

        const prototype =
            Object.getPrototypeOf(value);

        return (
            prototype === null ||
            Object.prototype.toString.call(value) ===
                '[object Object]'
        );
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

    engine.schema = Object.freeze({
        version: DEFINITIONS.version,
        definitions: DEFINITIONS,
        validate
    });

    global.ExecutiveSlideEngine = engine;

})(
    typeof globalThis !== 'undefined'
        ? globalThis
        : window
);
