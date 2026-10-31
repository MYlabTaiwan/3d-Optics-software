/**
 * OptiPath 3D - Periscope & Cage System Generator Wizard
 * Generates automated 2-mirror periscopes and Thorlabs cage system assemblies
 * for raising/lowering beams between tables, decks, and microscope ports.
 */

class PeriscopeWizard {
    constructor(benchScene) {
        this.benchScene = benchScene;
    }

    /**
     * Builds and inserts a complete periscope assembly into the 3D scene
     */
    generatePeriscope(options = {}) {
        const type = options.type || "CAGE-PERISCOPE-30"; // or 'RS99'
        const inHeight = options.inputHeight || 100.0;
        const outHeight = options.outputHeight || 200.0;
        const deltaZ = outHeight - inHeight;
        const x = options.x !== undefined ? options.x : 0;
        const z = options.z !== undefined ? options.z : 0;
        const exitDirection = options.exitDirection || "forward";

        // Determine catalog entry
        const catalogId = (type === "RS99") ? "RS99" : "CAGE-PERISCOPE-30";
        const baseData = window.COMPONENT_CATALOG[catalogId];

        // Clone component configuration
        const periData = JSON.parse(JSON.stringify(baseData));
        periData.elevation_delta_mm = deltaZ;
        periData.default_height_mm = inHeight;
        periData.name = (type === "RS99")
            ? `RS99 Periscope (+${deltaZ.toFixed(0)}mm)`
            : `30mm Cage Periscope (+${deltaZ.toFixed(0)}mm)`;

        // Calculate appropriate ER cage rods or post
        if (type === "CAGE-PERISCOPE-30") {
            const rodLengthReq = Math.abs(deltaZ) + 30;
            // Round to nearest Thorlabs ER rod length (1", 2", 3", 4", 6", 8", 12")
            let standardRod = "ER4";
            if (rodLengthReq <= 50) standardRod = "ER2";
            else if (rodLengthReq <= 80) standardRod = "ER3";
            else if (rodLengthReq <= 110) standardRod = "ER4";
            else if (rodLengthReq <= 160) standardRod = "ER6";
            else standardRod = "ER8";

            periData.cage_rod_part = standardRod;
        }

        // Add to bench scene
        const comp = this.benchScene.addComponent(catalogId, { x, y: inHeight, z });
        if (comp) {
            comp.data = periData;
            comp.mesh.position.set(x, inHeight, z);

            // Handle exit rotation
            let rotDeg = 0;
            if (exitDirection === "left") rotDeg = 90;
            else if (exitDirection === "right") rotDeg = -90;
            else if (exitDirection === "reverse") rotDeg = 180;

            comp.mesh.rotation.y = THREE.MathUtils.degToRad(rotDeg);
            this.benchScene.onComponentMoved(comp);
        }

        return comp;
    }

    /**
     * Preset for overhead laser coupling into Zeiss Axio Imager top phototube port (500mm)
     */
    buildZeissTopLaserCoupler(x = 0, z = -35) {
        return this.generatePeriscope({
            type: "CAGE-PERISCOPE-30",
            inputHeight: 100.0,
            outputHeight: 500.0,
            x: x,
            z: z,
            exitDirection: "forward"
        });
    }

    /**
     * Preset for laser coupling into Zeiss Axio Imager rear laser/epi port (350mm)
     */
    buildZeissRearLaserCoupler(x = 0, z = -230) {
        return this.generatePeriscope({
            type: "CAGE-PERISCOPE-30",
            inputHeight: 100.0,
            outputHeight: 350.0,
            x: x,
            z: z,
            exitDirection: "forward"
        });
    }

    /**
     * Preset for coupling laser from main table (100mm) into Olympus IX73 side port (155mm)
     */
    buildOlympusCoupler(side = "left") {
        return this.generatePeriscope({
            type: "CAGE-PERISCOPE-30",
            inputHeight: 100.0,
            outputHeight: 155.0,
            exitDirection: side === "left" ? "left" : "right"
        });
    }

    /**
     * Preset for coupling laser into Olympus IX73 rear epi-fluorescence port (215mm)
     */
    buildOlympusEpiCoupler() {
        return this.generatePeriscope({
            type: "CAGE-PERISCOPE-30",
            inputHeight: 100.0,
            outputHeight: 215.0,
            exitDirection: "forward"
        });
    }

    /**
     * Preset for 90° mirror periscope coupling directly into microscope with retro-collection to DM
     */
    buildMicroscopeRetroCoupler(options = {}) {
        const outH = options.outputHeight || 350.0;
        const x = options.x !== undefined ? options.x : -50;
        const z = options.z !== undefined ? options.z : 120;
        return this.generatePeriscope({
            type: "CAGE-PERISCOPE-30",
            inputHeight: 100.0,
            outputHeight: outH,
            x: x,
            z: z,
            exitDirection: "forward"
        });
    }
}

window.PeriscopeWizard = PeriscopeWizard;
