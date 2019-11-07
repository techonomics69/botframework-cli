/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for
 * license information.
 *
 * Code generated by Microsoft (R) AutoRest Code Generator.
 * Changes may cause incorrect behavior and will be lost if the code is
 * regenerated.
 */

'use strict';

/**
 * A suggested intent.
 *
 */
class IntentPrediction {
  /**
   * Create a IntentPrediction.
   * @property {string} [name] The intent's name
   * @property {number} [score] The intent's score, based on the prediction
   * model.
   */
  constructor() {
  }

  /**
   * Defines the metadata of IntentPrediction
   *
   * @returns {object} metadata of IntentPrediction
   *
   */
  mapper() {
    return {
      required: false,
      serializedName: 'IntentPrediction',
      type: {
        name: 'Composite',
        className: 'IntentPrediction',
        modelProperties: {
          name: {
            required: false,
            serializedName: 'name',
            type: {
              name: 'String'
            }
          },
          score: {
            required: false,
            serializedName: 'score',
            type: {
              name: 'Number'
            }
          }
        }
      }
    };
  }
}

module.exports = IntentPrediction;
