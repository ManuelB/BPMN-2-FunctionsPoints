/*!
 * ${copyright}
 */

/**
 * File-based DataBinding
 *
 * @namespace
 * @name bpmn2fpa.model
 * @public
 */
sap.ui.define(['jquery.sap.global', 'sap/ui/model/json/JSONModel'],
    function(jQuery, JSONModel) {
        "use strict";


        /**
         * Constructor for a new FileModel.
         *
         * @class
         * Model implementation for FileModel
         *
         * @extends sap.ui.model.JSONModel
         *
         * @author Incentergy GmbH
         * @version ${version}
         *
         * @param {object} oData a list of files
         * @constructor
         * @public
         * @alias bpmn2fpa.model.FileModel
         */
        var FileModel = JSONModel.extend("bpmn2fpa.model.FileModel", /** @lends bpmn2fpa.model.FileModel.prototype */ {

            constructor: function() {
                JSONModel.apply(this, [{ "files": [] }, true]);
            }
        });

        FileModel.prototype.getFileByName = function(fileName) {
            var results = this.getData().files.filter(function(file) { return (file.name == fileName); });
            if (results.length > 0) {
                return results[0];
            } else {
                return undefined;
            }
        };

        FileModel.prototype.addFile = function(oFile) {
            this.getData().files.push(oFile);
        };

        return FileModel;
    });