sap.ui.define(["sap/ui/core/UIComponent", "bpmn2fpa/model/FileModel"],
    function(UIComponent, FileModel) {
        "use strict";
        return UIComponent.extend("bpmn2fpa.Component", {

            metadata: {
                manifest: "json"
            },

            init: function() {
                // call the init function of the parent
                UIComponent.prototype.init.apply(this, arguments);
                sap.ui.getCore().setModel(new FileModel());


                // create the views based on the url/hash
                this.getRouter().initialize();

            }
        });
    });