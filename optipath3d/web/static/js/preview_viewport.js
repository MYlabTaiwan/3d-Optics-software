/**
 * OptiPath 3D - Component Preview Inspector Viewport
 * Provides an independent, real-time 3D interactive preview of any selected component
 * BEFORE adding it to the optical table.
 * Includes true-to-life 3D models for Zeiss Axio Imager, Olympus, Princeton, and Andor.
 */

class ComponentPreviewViewport {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.error(`Preview container #${containerId} not found.`);
            return;
        }

        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.currentMeshGroup = null;
        this.autoRotate = true;
        this.currentComponentData = null;
        this.animationFrameId = null;

        this.init();
    }

    init() {
        const width = this.container.clientWidth || 320;
        const height = this.container.clientHeight || 240;

        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x131822); // Deep studio slate

        // Camera
        this.camera = new THREE.PerspectiveCamera(45, width / height, 1, 3000);
        this.camera.position.set(160, 140, 200);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // Clear existing content and append
        this.container.innerHTML = '';
        this.container.appendChild(this.renderer.domElement);

        // OrbitControls
        if (typeof THREE.OrbitControls !== 'undefined') {
            this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
            this.controls.enableDamping = true;
            this.controls.dampingFactor = 0.05;
            this.controls.maxDistance = 1200;
            this.controls.minDistance = 30;
        }

        // Studio Lighting Setup
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
        this.scene.add(ambientLight);

        const keyLight = new THREE.DirectionalLight(0xffffff, 0.95);
        keyLight.position.set(200, 300, 250);
        keyLight.castShadow = true;
        this.scene.add(keyLight);

        const fillLight = new THREE.DirectionalLight(0x7aa2f7, 0.55);
        fillLight.position.set(-200, 100, -200);
        this.scene.add(fillLight);

        const rimLight = new THREE.DirectionalLight(0x00ff88, 0.35);
        rimLight.position.set(0, -200, 200);
        this.scene.add(rimLight);

        // Subtle circular pedestal grid
        const grid = new THREE.PolarGridHelper(120, 12, 8, 32, 0x2e3c54, 0x1d2738);
        grid.position.y = -40;
        this.scene.add(grid);

        // Resize Listener & Observer
        window.addEventListener('resize', () => this.onResize());
        if (window.ResizeObserver && this.container) {
            this.resizeObserver = new ResizeObserver(() => this.onResize());
            this.resizeObserver.observe(this.container);
        }

        // Start render loop
        this.animate = this.animate.bind(this);
        this.animate();
    }

    onResize() {
        if (!this.container || !this.renderer || !this.camera) return;
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        if (width === 0 || height === 0) return;
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    toggleAutoRotate() {
        this.autoRotate = !this.autoRotate;
        return this.autoRotate;
    }

    resetCamera() {
        if (!this.camera || !this.controls) return;
        this.camera.position.set(160, 140, 200);
        this.controls.target.set(0, 10, 0);
        this.controls.update();
    }

    showComponent(componentData) {
        this.currentComponentData = componentData;
        if (!componentData) return;

        // Remove previous model
        if (this.currentMeshGroup) {
            this.scene.remove(this.currentMeshGroup);
            this.currentMeshGroup.traverse(child => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
                    else child.material.dispose();
                }
            });
            this.currentMeshGroup = null;
        }

        // Build procedural 3D model
        this.currentMeshGroup = this.buildProceduralModel(componentData);
        this.scene.add(this.currentMeshGroup);

        // Adjust camera distance based on component dimensions
        const dims = componentData.dimensions || { width: 50, height: 60, length: 50 };
        const maxDim = Math.max(dims.width, dims.height, dims.length);
        const targetDist = maxDim * 2.6;

        this.camera.position.set(targetDist * 0.7, targetDist * 0.6, targetDist * 0.9);
        if (this.controls) {
            this.controls.target.set(0, (componentData.type === "microscope_frame") ? 40 : 0, 0);
            this.controls.update();
        }

        this.updateSpecsPanel(componentData);
    }

    /**
     * Builds realistic 3D CAD mesh representations of optomechanics, microscopes, and cage systems
     */
    buildProceduralModel(data) {
        const group = new THREE.Group();
        const type = data.type || "mirror";

        // High-Quality PBR Materials
        const blackAnodizedMat = new THREE.MeshStandardMaterial({
            color: 0x181818,
            metalness: 0.85,
            roughness: 0.35
        });

        const stainlessSteelMat = new THREE.MeshStandardMaterial({
            color: 0xd8d8d8,
            metalness: 0.95,
            roughness: 0.15
        });

        const brassKnobMat = new THREE.MeshStandardMaterial({
            color: 0xb5943b,
            metalness: 0.9,
            roughness: 0.3
        });

        const glassOpticMat = new THREE.MeshPhysicalMaterial({
            color: 0xffffff,
            metalness: 0.1,
            roughness: 0.05,
            transmission: 0.92,
            thickness: 12,
            transparent: true,
            opacity: 0.85
        });

        const mirrorCoatingMat = new THREE.MeshStandardMaterial({
            color: 0x88ccff,
            metalness: 0.98,
            roughness: 0.05
        });

        const laserGlowMat = new THREE.MeshBasicMaterial({
            color: new THREE.Color(data.color_hex || 0x00ff41),
            wireframe: false
        });

        const zeissBlueMat = new THREE.MeshStandardMaterial({
            color: 0x002f6c, // Authentic Zeiss Deep Cobalt Blue
            metalness: 0.3,
            roughness: 0.3
        });

        const zeissWhiteMat = new THREE.MeshStandardMaterial({
            color: 0xf5f6f8, // Laboratory Clean Pearl White Casting
            metalness: 0.15,
            roughness: 0.35
        });

        const zeissAxiocamBlueMat = new THREE.MeshStandardMaterial({
            color: 0x004593, // Zeiss Axiocam Metallic Blue
            metalness: 0.7,
            roughness: 0.25
        });

        // =====================================================================
        // 1. MICROSCOPE FRAMES (ZEISS AXIO IMAGER, OBSERVER & OLYMPUS IX/BX)
        // =====================================================================
        if (type === "microscope_frame") {
            const series = data.microscope_series || data.name;

            // --- ZEISS AXIO IMAGER A2m / Z2m (MATCHING UPLOADED USER IMAGE) ---
            if (series.includes("Zeiss Axio Imager") || data.id === "ZEISS-AXIO-IMG") {
                const imagerGroup = new THREE.Group();

                // 1. Base Casting with curved front bevel
                const baseGeo = new THREE.BoxGeometry(180, 50, 240);
                const baseMesh = new THREE.Mesh(baseGeo, zeissWhiteMat);
                baseMesh.position.set(0, -75, -20);
                imagerGroup.add(baseMesh);

                // Zeiss Blue Front Logo Plate
                const logoGeo = new THREE.BoxGeometry(45, 14, 4);
                const logoMesh = new THREE.Mesh(logoGeo, zeissBlueMat);
                logoMesh.position.set(0, -85, 101);
                imagerGroup.add(logoMesh);

                // Coaxial Coarse & Fine Focus Knobs (Left & Right)
                const coarseKnobGeo = new THREE.CylinderGeometry(18, 18, 14, 24);
                coarseKnobGeo.rotateZ(Math.PI / 2);
                const fineKnobGeo = new THREE.CylinderGeometry(11, 11, 24, 24);
                fineKnobGeo.rotateZ(Math.PI / 2);

                const knobL_c = new THREE.Mesh(coarseKnobGeo, blackAnodizedMat);
                knobL_c.position.set(-97, -75, -40);
                const knobL_f = new THREE.Mesh(fineKnobGeo, brassKnobMat);
                knobL_f.position.set(-102, -75, -40);

                const knobR_c = new THREE.Mesh(coarseKnobGeo, blackAnodizedMat);
                knobR_c.position.set(97, -75, -40);
                const knobR_f = new THREE.Mesh(fineKnobGeo, brassKnobMat);
                knobR_f.position.set(102, -75, -40);
                imagerGroup.add(knobL_c, knobL_f, knobR_c, knobR_f);

                // 2. Upright Arm Column with Zeiss Signature Blue Flank Panels
                const armGeo = new THREE.BoxGeometry(120, 190, 130);
                const armMesh = new THREE.Mesh(armGeo, zeissWhiteMat);
                armMesh.position.set(0, 30, -70);
                imagerGroup.add(armMesh);

                // Side Blue Panels with "AXIO" vertical accent
                const sidePanelGeo = new THREE.BoxGeometry(3, 160, 110);
                const leftSidePanel = new THREE.Mesh(sidePanelGeo, zeissBlueMat);
                leftSidePanel.position.set(-61, 30, -70);
                const rightSidePanel = new THREE.Mesh(sidePanelGeo, zeissBlueMat);
                rightSidePanel.position.set(61, 30, -70);
                imagerGroup.add(leftSidePanel, rightSidePanel);

                // Upper Nosepiece Carrier Head
                const headCarrierGeo = new THREE.BoxGeometry(130, 45, 140);
                const headCarrier = new THREE.Mesh(headCarrierGeo, zeissWhiteMat);
                headCarrier.position.set(0, 135, -30);
                imagerGroup.add(headCarrier);

                // "imager.A2m" Front Control Panel (Silver grey)
                const panelGeo = new THREE.BoxGeometry(85, 25, 4);
                const panelMesh = new THREE.Mesh(panelGeo, stainlessSteelMat);
                panelMesh.position.set(0, 135, 41);
                imagerGroup.add(panelMesh);

                // 3. Circular Rotating Polarizing Stage
                const stageGeo = new THREE.CylinderGeometry(75, 75, 12, 36);
                const stageMesh = new THREE.Mesh(stageGeo, blackAnodizedMat);
                stageMesh.position.set(0, -25, 20);
                imagerGroup.add(stageMesh);

                // XY Drive Drop Knobs
                const xyKnobGeo = new THREE.CylinderGeometry(7, 7, 35, 16);
                const xyKnob = new THREE.Mesh(xyKnobGeo, blackAnodizedMat);
                xyKnob.position.set(68, -48, 25);
                imagerGroup.add(xyKnob);

                // Sub-stage Condenser Unit
                const condGeo = new THREE.CylinderGeometry(28, 24, 30, 24);
                const condMesh = new THREE.Mesh(condGeo, blackAnodizedMat);
                condMesh.position.set(0, -48, 20);
                imagerGroup.add(condMesh);

                // 4. Revolving 6-Position Objective Turret
                const turretGeo = new THREE.CylinderGeometry(36, 42, 20, 32);
                turretGeo.rotateX(Math.PI / 12); // Slightly tilted
                const turretMesh = new THREE.Mesh(turretGeo, stainlessSteelMat);
                turretMesh.position.set(0, 95, 20);
                imagerGroup.add(turretMesh);

                // 5 Installed High-NA Objectives with color-coded magnification rings
                const objRingColors = [0xffd700, 0x00a86b, 0x0070ba, 0xffffff, 0xff3b30];
                for (let i = 0; i < 5; i++) {
                    const ang = (i * Math.PI * 2) / 6 - Math.PI / 2;
                    const ox = Math.cos(ang) * 25;
                    const oz = 20 + Math.sin(ang) * 25;

                    const objBody = new THREE.Mesh(new THREE.CylinderGeometry(7, 8, 30, 16), stainlessSteelMat);
                    objBody.position.set(ox, 72, oz);

                    const ringMat = new THREE.MeshBasicMaterial({ color: objRingColors[i] });
                    const ring = new THREE.Mesh(new THREE.CylinderGeometry(8.2, 8.2, 4, 16), ringMat);
                    ring.position.set(ox, 68, oz);

                    imagerGroup.add(objBody, ring);
                }

                // 5. Ergonomic Trinocular Eyepiece Tube
                const tubeGeo = new THREE.BoxGeometry(80, 50, 95);
                tubeGeo.rotateX(-Math.PI / 7);
                const tubeMesh = new THREE.Mesh(tubeGeo, zeissWhiteMat);
                tubeMesh.position.set(0, 175, -20);
                imagerGroup.add(tubeMesh);

                // Dual Inclined Eyepieces
                const eyeGeo = new THREE.CylinderGeometry(9, 10, 42, 24);
                eyeGeo.rotateX(-Math.PI / 4);

                const eyeL = new THREE.Mesh(eyeGeo, blackAnodizedMat);
                eyeL.position.set(-25, 205, 15);
                const eyeR = new THREE.Mesh(eyeGeo, blackAnodizedMat);
                eyeR.position.set(25, 205, 15);
                imagerGroup.add(eyeL, eyeR);

                // 6. DYNAMIC CONFIGURABLE PORTS (TOP PHOTOTUBE & LEFT SIDE MOUNT)
                const portConfig = data.port_configuration || {
                    top_port: "laser_in",
                    left_port: "camera",
                    rear_port: "laser_in"
                };

                // --- A. TOP PHOTOTUBE PORT ---
                const phototubeStem = new THREE.Mesh(new THREE.CylinderGeometry(14, 16, 25, 24), stainlessSteelMat);
                phototubeStem.position.set(0, 205, -35);
                imagerGroup.add(phototubeStem);

                if (portConfig.top_port === "laser_in") {
                    // Precision Laser Injection Coupling Flange & Cage Alignment Mount
                    const laserCoupler = new THREE.Mesh(new THREE.CylinderGeometry(18, 18, 14, 24), blackAnodizedMat);
                    laserCoupler.position.set(0, 222, -35);

                    // Cage Rods Collar (Thorlabs 30mm cage interface adapter)
                    const cageCollar = new THREE.Mesh(new THREE.BoxGeometry(36, 6, 36), blackAnodizedMat);
                    cageCollar.position.set(0, 230, -35);

                    // Glowing Overhead Laser Entry Port Target
                    const topTargetRing = new THREE.Mesh(
                        new THREE.TorusGeometry(12, 2.5, 16, 32),
                        new THREE.MeshBasicMaterial({ color: 0x00ffcc })
                    );
                    topTargetRing.rotateX(Math.PI / 2);
                    topTargetRing.position.set(0, 234, -35);

                    // Alignment Crosshair Target Reticle
                    const crossMat = new THREE.LineBasicMaterial({ color: 0x00ffcc, linewidth: 2 });
                    const crossGeo = new THREE.BufferGeometry().setFromPoints([
                        new THREE.Vector3(-10, 234, -35), new THREE.Vector3(10, 234, -35),
                        new THREE.Vector3(0, 234, -45), new THREE.Vector3(0, 234, -25)
                    ]);
                    const crosshair = new THREE.LineSegments(crossGeo, crossMat);

                    imagerGroup.add(laserCoupler, cageCollar, topTargetRing, crosshair);
                } else if (portConfig.top_port === "camera") {
                    // Top Zeiss Axiocam Camera Cube
                    const axiocamGeo = new THREE.BoxGeometry(45, 45, 45);
                    const axiocam = new THREE.Mesh(axiocamGeo, zeissAxiocamBlueMat);
                    axiocam.position.set(0, 240, -35);

                    const camLogo = new THREE.Mesh(new THREE.BoxGeometry(20, 10, 2), stainlessSteelMat);
                    camLogo.position.set(0, 245, -12);
                    imagerGroup.add(axiocam, camLogo);
                } else {
                    // Open Phototube C-Mount Adapter Ring
                    const openFlange = new THREE.Mesh(new THREE.CylinderGeometry(16, 16, 6, 24), stainlessSteelMat);
                    openFlange.position.set(0, 220, -35);
                    imagerGroup.add(openFlange);
                }

                // --- B. LEFT SIDE DETECTOR MOUNT (TV PORT) ---
                // Left C-Mount TV Tube emerging from left carrier flank (X = -65 to -90)
                const leftTube = new THREE.Mesh(new THREE.CylinderGeometry(14, 14, 25, 24), stainlessSteelMat);
                leftTube.rotateZ(Math.PI / 2);
                leftTube.position.set(-77.5, 135, -20);
                imagerGroup.add(leftTube);

                if (portConfig.left_port === "camera") {
                    // Left-Mounted Zeiss Axiocam Camera Cube (Horizontal C-Mount)
                    const sideAxiocam = new THREE.Mesh(new THREE.BoxGeometry(45, 45, 45), zeissAxiocamBlueMat);
                    sideAxiocam.position.set(-112.5, 135, -20);

                    // Axiocam silver front faceplate
                    const sideCamFace = new THREE.Mesh(new THREE.BoxGeometry(2, 22, 22), stainlessSteelMat);
                    sideCamFace.position.set(-89, 135, -20);

                    // Axiocam top/side heatsink ridge accents
                    const heatsinkRidge = new THREE.Mesh(new THREE.BoxGeometry(43, 4, 43), blackAnodizedMat);
                    heatsinkRidge.position.set(-112.5, 158, -20);

                    imagerGroup.add(sideAxiocam, sideCamFace, heatsinkRidge);
                } else if (portConfig.left_port === "spectrometer") {
                    // Spectrometer / Fiber Collimator Coupling Interface
                    const specCoupler = new THREE.Mesh(new THREE.CylinderGeometry(18, 16, 32, 24), blackAnodizedMat);
                    specCoupler.rotateZ(Math.PI / 2);
                    specCoupler.position.set(-106, 135, -20);

                    // Optical Emission Port Glow Ring
                    const emissionRing = new THREE.Mesh(
                        new THREE.TorusGeometry(12, 2.5, 16, 32),
                        new THREE.MeshBasicMaterial({ color: 0xff00d4 }) // Raman Stokes Pink/Magenta
                    );
                    emissionRing.rotateY(Math.PI / 2);
                    emissionRing.position.set(-123, 135, -20);

                    imagerGroup.add(specCoupler, emissionRing);
                } else {
                    // Protective Knurled Dust Cap
                    const dustCap = new THREE.Mesh(new THREE.CylinderGeometry(15, 15, 6, 24), blackAnodizedMat);
                    dustCap.rotateZ(Math.PI / 2);
                    dustCap.position.set(-91, 135, -20);
                    imagerGroup.add(dustCap);
                }

                // 7. Rear Laser / Lamphouse Coupling Port
                const rearPortBox = new THREE.Mesh(new THREE.BoxGeometry(60, 90, 55), blackAnodizedMat);
                rearPortBox.position.set(0, 50, -155);
                const rearFlange = new THREE.Mesh(new THREE.CylinderGeometry(18, 18, 16, 24), stainlessSteelMat);
                rearFlange.rotateX(Math.PI / 2);
                rearFlange.position.set(0, 50, -188);

                // Glowing port target
                const portRing = new THREE.Mesh(new THREE.TorusGeometry(14, 2.5, 16, 32), new THREE.MeshBasicMaterial({ color: 0x00d2ff }));
                portRing.position.set(0, 50, -196);
                imagerGroup.add(rearPortBox, rearFlange, portRing);

                // 8. AXIO IMAGER.Z2m FRONT TOUCHSCREEN TFT & JOYSTICK POD (USER IMAGE SPEC)
                // Right-Front TFT Touchscreen Control Console
                const consoleBase = new THREE.Mesh(new THREE.BoxGeometry(55, 12, 70), zeissWhiteMat);
                consoleBase.position.set(115, -75, 75);
                const screenTilted = new THREE.Mesh(new THREE.BoxGeometry(48, 3, 56), new THREE.MeshStandardMaterial({
                    color: 0x002f6c,
                    roughness: 0.2
                }));
                screenTilted.rotateX(-Math.PI / 6);
                screenTilted.position.set(115, -67, 75);
                const displayGlass = new THREE.Mesh(new THREE.PlaneGeometry(42, 50), new THREE.MeshBasicMaterial({
                    color: 0x0078d4 // Glowing blue Zeiss touchscreen UI
                }));
                displayGlass.rotateX(-Math.PI / 3);
                displayGlass.position.set(115, -65, 76);
                imagerGroup.add(consoleBase, screenTilted, displayGlass);

                // Left-Front Motorized Focus & XY Joystick Pod
                const joystickBase = new THREE.Mesh(new THREE.BoxGeometry(42, 16, 45), blackAnodizedMat);
                joystickBase.position.set(-115, -75, 75);
                const stickStem = new THREE.Mesh(new THREE.CylinderGeometry(2, 2.5, 18, 16), stainlessSteelMat);
                stickStem.position.set(-115, -62, 75);
                const stickBall = new THREE.Mesh(new THREE.SphereGeometry(5, 16, 16), blackAnodizedMat);
                stickBall.position.set(-115, -53, 75);
                imagerGroup.add(joystickBase, stickStem, stickBall);

                group.add(imagerGroup);
            }
            // --- OLYMPUS IX73 INVERTED FRAME ---
            else if (series.includes("IX73") || data.id === "OLYMPUS-IX73") {
                const ixGroup = new THREE.Group();
                const baseMesh = new THREE.Mesh(new THREE.BoxGeometry(170, 50, 250), zeissWhiteMat);
                baseMesh.position.set(0, -65, 0);
                ixGroup.add(baseMesh);

                const stageMesh = new THREE.Mesh(new THREE.BoxGeometry(190, 12, 170), blackAnodizedMat);
                stageMesh.position.set(0, 15, 20);
                ixGroup.add(stageMesh);

                const pillar = new THREE.Mesh(new THREE.BoxGeometry(85, 180, 80), zeissWhiteMat);
                pillar.position.set(0, 25, -90);
                ixGroup.add(pillar);

                const condenserArm = new THREE.Mesh(new THREE.BoxGeometry(60, 40, 140), zeissWhiteMat);
                condenserArm.position.set(0, 125, -30);
                ixGroup.add(condenserArm);

                // Left side spectrometer port
                const leftPort = new THREE.Mesh(new THREE.CylinderGeometry(16, 16, 18, 24), stainlessSteelMat);
                leftPort.rotateZ(Math.PI / 2);
                leftPort.position.set(-92, -15, 20);
                const leftRing = new THREE.Mesh(new THREE.TorusGeometry(12, 2.5, 16, 32), new THREE.MeshBasicMaterial({ color: 0x00d2ff }));
                leftRing.rotateY(Math.PI / 2);
                leftRing.position.set(-102, -15, 20);
                ixGroup.add(leftPort, leftRing);

                group.add(ixGroup);
            }
            // --- OLYMPUS BX53 / ZEISS OBSERVER FALLBACK ---
            else {
                const stdFrame = new THREE.Mesh(new THREE.BoxGeometry(150, 220, 200), zeissWhiteMat);
                group.add(stdFrame);
            }
        }

        // =====================================================================
        // 2. PRINCETON & ANDOR SPECTROMETERS
        // =====================================================================
        else if (type === "detector_spectro") {
            const isPrinceton = data.name.includes("Princeton") || data.id.includes("ISOPLANE");
            const spectroGroup = new THREE.Group();

            // Spectrograph Main Body
            const bodyGeo = new THREE.BoxGeometry(160, 100, 180);
            const bodyMat = isPrinceton ? blackAnodizedMat : new THREE.MeshStandardMaterial({ color: 0x1f242e, metalness: 0.8, roughness: 0.3 });
            const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
            spectroGroup.add(bodyMesh);

            // Grating Turret Access Dome
            const domeGeo = new THREE.CylinderGeometry(35, 38, 18, 32);
            const domeMesh = new THREE.Mesh(domeGeo, stainlessSteelMat);
            domeMesh.position.set(0, 58, -15);
            spectroGroup.add(domeMesh);

            // Precision Entrance Slit with Micrometer Drive
            const slitBody = new THREE.Mesh(new THREE.BoxGeometry(32, 45, 28), stainlessSteelMat);
            slitBody.position.set(-85, 0, 30);

            const micrometer = new THREE.Mesh(new THREE.CylinderGeometry(5.5, 5.5, 35, 24), brassKnobMat);
            micrometer.position.set(-85, 36, 30);

            // Entrance slit aperture ring
            const slitAperture = new THREE.Mesh(new THREE.TorusGeometry(8, 2, 16, 24), new THREE.MeshBasicMaterial({ color: 0x00ff88 }));
            slitAperture.rotateY(Math.PI / 2);
            slitAperture.position.set(-102, 0, 30);

            spectroGroup.add(slitBody, micrometer, slitAperture);

            // Camera Exit Port Flange
            const camFlange = new THREE.Mesh(new THREE.CylinderGeometry(24, 26, 20, 32), stainlessSteelMat);
            camFlange.rotateX(Math.PI / 2);
            camFlange.position.set(0, 0, 98);
            spectroGroup.add(camFlange);

            group.add(spectroGroup);
        }

        // =====================================================================
        // 3. SCIENTIFIC CCD & EMCCD CAMERAS (ANDOR IXON, PIXIS, AXIOCAM)
        // =====================================================================
        else if (type === "camera") {
            const camGroup = new THREE.Group();
            const isAxiocam = data.id === "ZEISS-AXIOCAM";
            const isAndor = data.id.includes("IXON") || data.name.includes("Andor");

            let camColor = 0x222222;
            if (isAxiocam) camColor = 0x004593;
            else if (isAndor) camColor = 0x1a2638;

            const camMat = new THREE.MeshStandardMaterial({ color: camColor, metalness: 0.75, roughness: 0.3 });
            const dims = data.dimensions || { width: 55, height: 55, length: 70 };

            const bodyMesh = new THREE.Mesh(new THREE.BoxGeometry(dims.width, dims.height, dims.length), camMat);
            camGroup.add(bodyMesh);

            // Cooling Fin Grids
            const finGeo = new THREE.BoxGeometry(dims.width + 4, dims.height - 10, 2);
            for (let f = -dims.length / 3; f <= dims.length / 3; f += 8) {
                const fin = new THREE.Mesh(finGeo, blackAnodizedMat);
                fin.position.z = f;
                camGroup.add(fin);
            }

            // C-mount Optical Front Flange
            const flange = new THREE.Mesh(new THREE.CylinderGeometry(15, 18, 14, 24), stainlessSteelMat);
            flange.rotateX(Math.PI / 2);
            flange.position.z = dims.length / 2 + 7;
            camGroup.add(flange);

            this.addPostStackToModel(camGroup, data, -dims.height / 2);
            this.addOpticalCenterAxis(camGroup, 0, 0, dims.length / 2 + 7);
            group.add(camGroup);
        }

        // =====================================================================
        // 4. CONFOCAL PINHOLE MOUNT (THORLABS MPH16)
        // =====================================================================
        else if (type === "confocal_pinhole") {
            const pinGroup = new THREE.Group();

            // Central Ring Mount
            const ringMesh = new THREE.Mesh(new THREE.CylinderGeometry(28, 28, 14, 32), blackAnodizedMat);
            ringMesh.rotateX(Math.PI / 2);
            ringMesh.name = "mount_hardware";
            ringMesh.userData.isMount = true;
            pinGroup.add(ringMesh);

            // Center Pinhole Foil
            const foilMesh = new THREE.Mesh(new THREE.CylinderGeometry(10, 10, 2, 24), stainlessSteelMat);
            foilMesh.rotateX(Math.PI / 2);
            foilMesh.name = "optic_element";
            foilMesh.userData.isOptic = true;

            const holeMesh = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 3, 16), new THREE.MeshBasicMaterial({ color: 0x000000 }));
            holeMesh.rotateX(Math.PI / 2);
            holeMesh.name = "optic_element";
            holeMesh.userData.isOptic = true;
            pinGroup.add(foilMesh, holeMesh);

            // X and Y Micrometer Thumbscrews
            const micGeo = new THREE.CylinderGeometry(4.5, 4.5, 26, 24);
            const micX = new THREE.Mesh(micGeo, brassKnobMat);
            micX.rotateZ(Math.PI / 2);
            micX.position.set(38, 0, 0);
            micX.name = "mount_hardware";
            micX.userData.isMount = true;

            const micY = new THREE.Mesh(micGeo, brassKnobMat);
            micY.position.set(0, 38, 0);
            micY.name = "mount_hardware";
            micY.userData.isMount = true;

            pinGroup.add(micX, micY);

            this.addPostStackToModel(pinGroup, data, -28);
            this.addOpticalCenterAxis(pinGroup, 0, 0, 0);
            group.add(pinGroup);
        }

        // =====================================================================
        // 5. MIRRORS (KM100, POLARIS, KM200) & FLIP MIRRORS (TRF90)
        // =====================================================================
        else if (type === "flip_mirror" || data.is_flip_mirror) {
            const flipGroup = new THREE.Group();
            const ap = (data.optic_diameter_mm || 25.4) / 2;
            const isBypassed = data.flip_state === "bypassed";

            // Stationary Base Mount with Hinge Clevis
            const baseGeo = new THREE.BoxGeometry(46, 14, 26);
            const baseMesh = new THREE.Mesh(baseGeo, blackAnodizedMat);
            baseMesh.position.set(0, -26, 0);
            baseMesh.name = "mount_hardware";
            baseMesh.userData.isMount = true;
            flipGroup.add(baseMesh);

            // Stainless Steel Hinge Pin & Clevis
            const pinGeo = new THREE.CylinderGeometry(2.5, 2.5, 48, 16);
            pinGeo.rotateZ(Math.PI / 2);
            const pinMesh = new THREE.Mesh(pinGeo, stainlessSteelMat);
            pinMesh.position.set(0, -20, 0);
            pinMesh.name = "mount_hardware";
            pinMesh.userData.isMount = true;
            flipGroup.add(pinMesh);

            // Kinematic Magnetic Stop Posts (Hard stops for 90° and pass-through)
            const stopGeo = new THREE.CylinderGeometry(3, 3, 8, 16);
            const stop1 = new THREE.Mesh(stopGeo, brassKnobMat);
            stop1.position.set(16, -16, 8);
            stop1.name = "mount_hardware";
            stop1.userData.isMount = true;

            const stop2 = new THREE.Mesh(stopGeo, brassKnobMat);
            stop2.position.set(-16, -16, 8);
            stop2.name = "mount_hardware";
            stop2.userData.isMount = true;
            flipGroup.add(stop1, stop2);

            // Movable Flipper Arm Group (pivots around hinge at Y = -20)
            const flipperArm = new THREE.Group();
            flipperArm.position.set(0, -20, 0);

            // When bypassed, flipper tilts down 90 degrees out of the beam!
            if (isBypassed) {
                flipperArm.rotation.x = Math.PI / 2;
            }

            // Mirror Carrier Frame (relative to pivot)
            const frameGeo = new THREE.BoxGeometry(ap * 2 + 16, ap * 2 + 18, 12);
            const frameMesh = new THREE.Mesh(frameGeo, blackAnodizedMat);
            frameMesh.position.set(0, 20, 0);
            frameMesh.name = "mount_hardware";
            frameMesh.userData.isMount = true;
            flipperArm.add(frameMesh);

            // Dielectric Mirror
            const mirrorGeo = new THREE.CylinderGeometry(ap, ap, 6, 32);
            mirrorGeo.rotateX(Math.PI / 2);
            const mirrorMesh = new THREE.Mesh(mirrorGeo, mirrorCoatingMat);
            mirrorMesh.position.set(0, 20, 2);
            mirrorMesh.name = "optic_element";
            mirrorMesh.userData.isOptic = true;
            flipperArm.add(mirrorMesh);

            // Thumb Lever / Toggle Handle
            const leverGeo = new THREE.CylinderGeometry(3, 3, 16, 16);
            leverGeo.rotateZ(Math.PI / 3);
            const lever = new THREE.Mesh(leverGeo, stainlessSteelMat);
            lever.position.set(ap + 10, ap + 22, -2);
            lever.name = "mount_hardware";
            lever.userData.isMount = true;
            flipperArm.add(lever);

            // Brass Kinematic Adjusting Knobs
            const knobGeo = new THREE.CylinderGeometry(4, 4, 12, 16);
            knobGeo.rotateX(Math.PI / 2);
            const knob1 = new THREE.Mesh(knobGeo, brassKnobMat);
            knob1.position.set(ap + 4, ap + 20, -7);
            knob1.name = "mount_hardware";
            knob1.userData.isMount = true;

            const knob2 = new THREE.Mesh(knobGeo, brassKnobMat);
            knob2.position.set(-ap - 4, ap + 20, -7);
            knob2.name = "mount_hardware";
            knob2.userData.isMount = true;
            flipperArm.add(knob1, knob2);

            flipGroup.add(flipperArm);

            this.addPostStackToModel(flipGroup, data, -33);
            this.addOpticalCenterAxis(flipGroup, 0, 0, 0);
            group.add(flipGroup);
        }
        else if (type === "mirror" || type === "filter_edge") {
            const ap = (data.optic_diameter_mm || 25.4) / 2;

            // Optic Head: Kinematic mirror frame, dielectric mirror disk, and adjustment screws
            // Can be pitched / tilted (e.g. 45° fold mirror) while the post remains vertical!
            const opticHead = new THREE.Group();
            opticHead.name = "optic_head";

            const frameGeo = new THREE.BoxGeometry(ap * 2 + 18, ap * 2 + 24, 12);
            const frameMesh = new THREE.Mesh(frameGeo, blackAnodizedMat);
            frameMesh.name = "mount_hardware";
            frameMesh.userData.isMount = true;
            opticHead.add(frameMesh);

            const mirrorGeo = new THREE.CylinderGeometry(ap, ap, 6, 32);
            mirrorGeo.rotateX(Math.PI / 2);
            const mirrorMesh = new THREE.Mesh(mirrorGeo, type === "filter_edge" ? glassOpticMat : mirrorCoatingMat);
            mirrorMesh.position.z = 2;
            mirrorMesh.name = "optic_element";
            mirrorMesh.userData.isOptic = true;
            opticHead.add(mirrorMesh);

            const knobGeo = new THREE.CylinderGeometry(4.5, 4.5, 14, 16);
            knobGeo.rotateX(Math.PI / 2);
            const knob1 = new THREE.Mesh(knobGeo, brassKnobMat);
            knob1.position.set(ap + 4, ap + 6, -8);
            knob1.name = "mount_hardware";
            knob1.userData.isMount = true;

            const knob2 = new THREE.Mesh(knobGeo, brassKnobMat);
            knob2.position.set(-ap - 4, ap + 6, -8);
            knob2.name = "mount_hardware";
            knob2.userData.isMount = true;
            opticHead.add(knob1, knob2);

            group.add(opticHead);

            // Grounded Post Stack extending vertically down to the breadboard
            const optHeight = data.default_height_mm || (data.position ? data.position.y : 100);
            this.addPostStackToModel(group, data, -ap - 12, optHeight);
            this.addOpticalCenterAxis(group, 0, 0, 0);
        }

        // =====================================================================
        // 6. LENSES (LMR1) & FILTERS
        // =====================================================================
        else if (type === "lens" || type === "filter_bandpass") {
            const r = (data.optic_diameter_mm || 25.4) / 2;
            const ringGeo = new THREE.CylinderGeometry(r + 6, r + 6, 10, 32);
            ringGeo.rotateX(Math.PI / 2);
            const ringMesh = new THREE.Mesh(ringGeo, blackAnodizedMat);
            ringMesh.name = "mount_hardware";
            ringMesh.userData.isMount = true;
            group.add(ringMesh);

            const lensGeo = new THREE.SphereGeometry(r, 32, 16);
            lensGeo.scale(1, 1, 0.25);
            const lensMesh = new THREE.Mesh(lensGeo, glassOpticMat);
            lensMesh.name = "optic_element";
            lensMesh.userData.isOptic = true;
            group.add(lensMesh);

            this.addPostStackToModel(group, data, -r - 6);
            this.addOpticalCenterAxis(group, 0, 0, 0);
        }

        // =====================================================================
        // 7. BEAMSPLITTER CUBES & DICHROICS
        // =====================================================================
        else if (type === "beamsplitter_cube" || type === "dichroic_cube") {
            const cubeSize = 38;
            const cubeFrameGeo = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
            const cubeFrameMesh = new THREE.Mesh(cubeFrameGeo, blackAnodizedMat);
            cubeFrameMesh.name = "mount_hardware";
            cubeFrameMesh.userData.isMount = true;
            group.add(cubeFrameMesh);

            const innerGlassGeo = new THREE.BoxGeometry(25.4, 25.4, 25.4);
            const innerGlassMesh = new THREE.Mesh(innerGlassGeo, glassOpticMat);
            innerGlassMesh.name = "optic_element";
            innerGlassMesh.userData.isOptic = true;
            group.add(innerGlassMesh);

            const diagGeo = new THREE.PlaneGeometry(25.4 * Math.SQRT2, 25.4);
            diagGeo.rotateY(Math.PI / 4);
            // Insert tint follows the cut-on wavelength (blue = short, red = long)
            const diagMat = mirrorCoatingMat.clone();
            if (data.cut_on_wavelength_nm) {
                const hue = Math.min(1, Math.max(0, (700 - data.cut_on_wavelength_nm) / 300)) * 0.75;
                diagMat.color = new THREE.Color().setHSL(hue, 0.75, 0.55);
            } else if (data.split_ratio) {
                diagMat.color = new THREE.Color(0xb8c4d8);
            }
            const diagMesh = new THREE.Mesh(diagGeo, diagMat);
            diagMesh.name = "optic_element";
            diagMesh.userData.isOptic = true;
            group.add(diagMesh);

            // Top-loading insert slot plate + retaining thumbscrew (part of the cube base)
            const slotPlate = new THREE.Mesh(new THREE.BoxGeometry(26, 4, 30), stainlessSteelMat);
            slotPlate.position.set(0, cubeSize / 2 + 2, 0);
            slotPlate.name = "mount_hardware";
            slotPlate.userData.isMount = true;
            group.add(slotPlate);
            const slotKnob = new THREE.Mesh(new THREE.CylinderGeometry(3.5, 3.5, 6, 16), brassKnobMat);
            slotKnob.position.set(0, cubeSize / 2 + 7, 0);
            slotKnob.name = "mount_hardware";
            slotKnob.userData.isMount = true;
            group.add(slotKnob);

            this.addPostStackToModel(group, data, -cubeSize / 2);
            this.addOpticalCenterAxis(group, 0, 0, 0);
        }

        // =====================================================================
        // 8. POLARIZATION & WAVEPLATES
        // =====================================================================
        else if (type.startsWith("waveplate") || type === "polarizer") {
            const r = 25.4;
            const stageGeo = new THREE.CylinderGeometry(r + 8, r + 8, 12, 32);
            stageGeo.rotateX(Math.PI / 2);
            const stageMesh = new THREE.Mesh(stageGeo, blackAnodizedMat);
            stageMesh.name = "mount_hardware";
            stageMesh.userData.isMount = true;
            group.add(stageMesh);

            const dialGeo = new THREE.CylinderGeometry(r + 4, r + 4, 13, 32);
            dialGeo.rotateX(Math.PI / 2);
            const dialMesh = new THREE.Mesh(dialGeo, stainlessSteelMat);
            dialMesh.name = "mount_hardware";
            dialMesh.userData.isMount = true;
            group.add(dialMesh);

            const opticGeo = new THREE.CylinderGeometry(r * 0.65, r * 0.65, 4, 32);
            opticGeo.rotateX(Math.PI / 2);
            const opticMesh = new THREE.Mesh(opticGeo, glassOpticMat);
            opticMesh.name = "optic_element";
            opticMesh.userData.isOptic = true;
            group.add(opticMesh);

            this.addPostStackToModel(group, data, -r - 8);
            this.addOpticalCenterAxis(group, 0, 0, 0);
        }

        // =====================================================================
        // 9. PERISCOPES & CAGE SYSTEMS (THORLABS C4W / ER RODS)
        // =====================================================================
        else if (data.is_periscope || type === "cage_periscope" || type === "periscope") {
            const deltaY = data.elevation_delta_mm || 150;

            if (type === "cage_periscope" || data.is_cage_system) {
                const cubeSize = 38;
                const cubeGeo = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);

                // 1. Bottom Kinematic Cage Cube (Optical center at Y = 0, World Y = 100mm)
                // Incoming horizontal laser enters here!
                const bottomCube = new THREE.Mesh(cubeGeo, blackAnodizedMat);
                bottomCube.name = "mount_hardware";
                bottomCube.userData.isMount = true;
                bottomCube.position.set(0, 0, 0);

                // Entrance aperture ring facing -Z
                const apGeo = new THREE.CylinderGeometry(12, 12, 6, 24);
                apGeo.rotateX(Math.PI / 2);
                const botInputAp = new THREE.Mesh(apGeo, stainlessSteelMat);
                botInputAp.name = "mount_hardware";
                botInputAp.userData.isMount = true;
                botInputAp.position.set(0, 0, -cubeSize / 2);
                bottomCube.add(botInputAp);

                // Internal 45° turning mirror (reflects incoming +Z horizontal ray vertically UP into +Y)
                // Added directly to group so optics remain visible even if mounts are toggled off
                const mirrorGeo = new THREE.CylinderGeometry(12.7, 12.7, 4, 32);
                mirrorGeo.rotateX(Math.PI / 4);
                const botMirror = new THREE.Mesh(mirrorGeo, mirrorCoatingMat);
                botMirror.name = "optic_element";
                botMirror.userData.isOptic = true;
                botMirror.position.set(0, 0, 0);
                group.add(botMirror);

                // 2. Top Kinematic Cage Cube (Optical center at Y = deltaY, World Y = 100 + deltaY)
                // Elevated beam turns inside this cube!
                const topCube = new THREE.Mesh(cubeGeo, blackAnodizedMat);
                topCube.name = "mount_hardware";
                topCube.userData.isMount = true;
                topCube.position.set(0, deltaY, 0);

                // Exit aperture ring facing +Z
                const topExitAp = new THREE.Mesh(apGeo, stainlessSteelMat);
                topExitAp.name = "mount_hardware";
                topExitAp.userData.isMount = true;
                topExitAp.position.set(0, 0, cubeSize / 2);
                topCube.add(topExitAp);

                // Second internal 45° turning mirror inside top cube (reflects vertical +Y ray horizontally into +Z)
                const topMirror = new THREE.Mesh(mirrorGeo, mirrorCoatingMat);
                topMirror.name = "optic_element";
                topMirror.userData.isOptic = true;
                topMirror.rotateX(-Math.PI / 4);
                topMirror.position.set(0, deltaY, 0);
                group.add(topMirror);

                group.add(bottomCube, topCube);

                // 3. 4x Thorlabs ER Series 30mm Cage Rods extending between bottom and top cubes
                const rodGeo = new THREE.CylinderGeometry(3, 3, deltaY + 24, 16);
                const rodOffset = 15;
                const offsets = [
                    [-rodOffset, -rodOffset],
                    [rodOffset, -rodOffset],
                    [-rodOffset, rodOffset],
                    [rodOffset, rodOffset]
                ];
                offsets.forEach(([ox, oz]) => {
                    const rod = new THREE.Mesh(rodGeo, stainlessSteelMat);
                    rod.name = "mount_hardware";
                    rod.userData.isMount = true;
                    rod.position.set(ox, deltaY / 2, oz);
                    group.add(rod);
                });

                // Optional Thorlabs 30mm Horizontal Overhead Cage Bridge over to Microscope
                if (data.has_overhead_arm || data.overhead_arm_length_mm) {
                    const armLen = data.overhead_arm_length_mm || 195;
                    const hRodGeo = new THREE.CylinderGeometry(3, 3, armLen + 24, 16);
                    hRodGeo.rotateX(Math.PI / 2);
                    offsets.forEach(([ox, oy]) => {
                        const hRod = new THREE.Mesh(hRodGeo, stainlessSteelMat);
                        hRod.name = "mount_hardware";
                        hRod.userData.isMount = true;
                        hRod.position.set(ox, deltaY + oy, armLen / 2);
                        group.add(hRod);
                    });

                    // Third C4W Cage Cube at the end of the overhead arm directly over microscope phototube!
                    const foldCube = new THREE.Mesh(cubeGeo, blackAnodizedMat);
                    foldCube.name = "mount_hardware";
                    foldCube.userData.isMount = true;
                    foldCube.position.set(0, deltaY, armLen);

                    // Downward turning mirror inside fold cube (reflects horizontal +Z into vertical -Y downwards)
                    const foldMirror = new THREE.Mesh(mirrorGeo, mirrorCoatingMat);
                    foldMirror.name = "optic_element";
                    foldMirror.userData.isOptic = true;
                    foldMirror.rotateX(-Math.PI / 4);
                    foldMirror.position.set(0, deltaY, armLen);
                    group.add(foldMirror);

                    // Downward coupling tube towards microscope phototube port
                    const downTubeGeo = new THREE.CylinderGeometry(15, 15, 22, 24);
                    const downTube = new THREE.Mesh(downTubeGeo, stainlessSteelMat);
                    downTube.name = "mount_hardware";
                    downTube.userData.isMount = true;
                    downTube.position.set(0, -cubeSize / 2 - 11, 0);
                    foldCube.add(downTube);

                    group.add(foldCube);
                }

                // Internal alignment beam cylinder between the two mirrors
                const beamGeo = new THREE.CylinderGeometry(1.2, 1.2, deltaY, 16);
                const beamMesh = new THREE.Mesh(beamGeo, laserGlowMat);
                beamMesh.name = "optic_element";
                beamMesh.userData.isOptic = true;
                beamMesh.position.y = deltaY / 2;
                group.add(beamMesh);

                // 4. Grounded Table Support Post extending from bottom cube down to optical breadboard
                this.addPostStackToModel(group, data, -cubeSize / 2, 100);
            } else {
                // Post-Mounted 2-Mirror Periscope (RS99)
                const uprightPostH = deltaY + 70;
                const uprightPostGeo = new THREE.CylinderGeometry(12.5, 12.5, uprightPostH, 24);
                const uprightPost = new THREE.Mesh(uprightPostGeo, stainlessSteelMat);
                uprightPost.name = "mount_hardware";
                uprightPost.userData.isMount = true;
                uprightPost.position.set(0, deltaY / 2 - 20, -25);
                group.add(uprightPost);

                const mountGeo = new THREE.BoxGeometry(36, 40, 20);
                const m1 = new THREE.Mesh(mountGeo, blackAnodizedMat);
                m1.name = "mount_hardware";
                m1.userData.isMount = true;
                m1.position.set(0, 0, 15);
                const m2 = new THREE.Mesh(mountGeo, blackAnodizedMat);
                m2.name = "mount_hardware";
                m2.userData.isMount = true;
                m2.position.set(0, deltaY, 15);
                group.add(m1, m2);

                const mirrorGeo = new THREE.CylinderGeometry(12.7, 12.7, 4, 32);
                mirrorGeo.rotateX(Math.PI / 4);
                const mir1 = new THREE.Mesh(mirrorGeo, mirrorCoatingMat);
                mir1.name = "optic_element";
                mir1.userData.isOptic = true;
                mir1.position.set(0, 0, 15);

                const mir2 = new THREE.Mesh(mirrorGeo, mirrorCoatingMat);
                mir2.name = "optic_element";
                mir2.userData.isOptic = true;
                mir2.rotateX(-Math.PI / 2);
                mir2.position.set(0, deltaY, 15);
                group.add(mir1, mir2);

                this.addPostStackToModel(group, data, -20, 100);
            }
        }

        // =====================================================================
        // 10. LASER SOURCES
        // =====================================================================
        else if (type === "laser_source") {
            const dims = data.dimensions || { width: 45, height: 45, length: 100 };
            const bodyGeo = new THREE.BoxGeometry(dims.width, dims.height, dims.length);
            const bodyMesh = new THREE.Mesh(bodyGeo, blackAnodizedMat);
            group.add(bodyMesh);

            const bezelGeo = new THREE.CylinderGeometry(8, 10, 12, 24);
            bezelGeo.rotateX(Math.PI / 2);
            const bezelMesh = new THREE.Mesh(bezelGeo, brassKnobMat);
            bezelMesh.position.z = dims.length / 2 + 6;
            group.add(bezelMesh);

            const beamStubGeo = new THREE.CylinderGeometry(1.5, 1.5, 45, 16);
            beamStubGeo.rotateX(Math.PI / 2);
            const beamStub = new THREE.Mesh(beamStubGeo, laserGlowMat);
            beamStub.position.z = dims.length / 2 + 30;
            group.add(beamStub);

            this.addPostStackToModel(group, data, -dims.height / 2);
        }

        // =====================================================================
        // 11. MULTI-LEVEL DECKS & BREADBOARDS
        // =====================================================================
        else if (data.is_deck) {
            const dims = data.dimensions || { width: 300, height: 35, length: 450 };
            const deckGeo = new THREE.BoxGeometry(dims.width, dims.height, dims.length);
            const deckMat = new THREE.MeshStandardMaterial({
                color: 0x22262e,
                metalness: 0.8,
                roughness: 0.3
            });
            const deckMesh = new THREE.Mesh(deckGeo, deckMat);
            group.add(deckMesh);

            const legH = data.elevation_mm || 180;
            const legGeo = new THREE.CylinderGeometry(16, 16, legH, 24);
            const legMat = new THREE.MeshStandardMaterial({ color: 0x999999, metalness: 0.9, roughness: 0.2 });

            const wHalf = dims.width / 2 - 35;
            const lHalf = dims.length / 2 - 35;
            const legPositions = [
                [-wHalf, -legH / 2 - dims.height / 2, -lHalf],
                [wHalf, -legH / 2 - dims.height / 2, -lHalf],
                [-wHalf, -legH / 2 - dims.height / 2, lHalf],
                [wHalf, -legH / 2 - dims.height / 2, lHalf]
            ];
            legPositions.forEach(pos => {
                const leg = new THREE.Mesh(legGeo, legMat);
                leg.position.set(pos[0], pos[1], pos[2]);
                group.add(leg);
            });
        }

        return group;
    }

    addPostStackToModel(group, data, attachY, opticalHeight = 100) {
        if (!data.post_stack || data.post_stack.base === "DIRECT") return;

        const stainlessSteelMat = new THREE.MeshStandardMaterial({
            color: 0xd0d0d0,
            metalness: 0.92,
            roughness: 0.18
        });

        const blackAnodizedMat = new THREE.MeshStandardMaterial({
            color: 0x1a1a1a,
            metalness: 0.85,
            roughness: 0.35
        });

        const mountStack = new THREE.Group();
        mountStack.name = "mount_post_stack";
        mountStack.userData.isMount = true;

        // The optical table surface is at Y = -opticalHeight relative to component centerline
        const tableY = -opticalHeight;

        // Base Plate (Thorlabs BA2 / Pedestal base with clamping fork slot)
        const baseH = 10;
        const baseGeo = new THREE.BoxGeometry(48, baseH, 56);
        const baseMesh = new THREE.Mesh(baseGeo, blackAnodizedMat);
        baseMesh.name = "mount_hardware";
        baseMesh.userData.isMount = true;
        baseMesh.position.y = tableY + baseH / 2;
        mountStack.add(baseMesh);

        // Clamping slot cutout accent
        const slotGeo = new THREE.BoxGeometry(14, baseH + 1, 32);
        const slotMesh = new THREE.Mesh(slotGeo, new THREE.MeshBasicMaterial({ color: 0x0a0d14 }));
        slotMesh.name = "mount_hardware";
        slotMesh.userData.isMount = true;
        slotMesh.position.set(0, tableY + baseH / 2, 10);
        mountStack.add(slotMesh);

        // Post Holder (Thorlabs PH series): Rests directly on base plate
        const holderH = Math.min(120, Math.max(35, opticalHeight * 0.4));
        const holderGeo = new THREE.CylinderGeometry(12.5, 12.5, holderH, 24);
        const holderMesh = new THREE.Mesh(holderGeo, blackAnodizedMat);
        holderMesh.name = "mount_hardware";
        holderMesh.userData.isMount = true;
        holderMesh.position.y = tableY + baseH + holderH / 2;
        mountStack.add(holderMesh);

        // Spring-loaded thumbscrew on post holder
        const thumbGeo = new THREE.CylinderGeometry(3.5, 3.5, 10, 16);
        thumbGeo.rotateZ(Math.PI / 2);
        const thumbMesh = new THREE.Mesh(thumbGeo, stainlessSteelMat);
        thumbMesh.name = "mount_hardware";
        thumbMesh.userData.isMount = true;
        thumbMesh.position.set(13, holderMesh.position.y, 0);
        mountStack.add(thumbMesh);

        // Optical Post (Thorlabs TR series): Extends from post holder up to mount attachment point
        const postBottom = tableY + baseH + 15;
        const postLength = Math.max(25, attachY - postBottom);
        const postGeo = new THREE.CylinderGeometry(6.35, 6.35, postLength, 24);
        const postMesh = new THREE.Mesh(postGeo, stainlessSteelMat);
        postMesh.name = "mount_hardware";
        postMesh.userData.isMount = true;
        postMesh.position.y = postBottom + postLength / 2;
        mountStack.add(postMesh);

        group.add(mountStack);
    }

    addOpticalCenterAxis(group, cx, cy, cz) {
        const lineGeo = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(cx, cy, cz - 40),
            new THREE.Vector3(cx, cy, cz + 40)
        ]);
        const lineMat = new THREE.LineDashedMaterial({
            color: 0x00ff88,
            dashSize: 4,
            gapSize: 2,
            linewidth: 2
        });
        const line = new THREE.Line(lineGeo, lineMat);
        line.computeLineDistances();
        group.add(line);
    }

    updateSpecsPanel(data) {
        const titleEl = document.getElementById("preview-item-title");
        const partEl = document.getElementById("preview-item-part");
        const vendorEl = document.getElementById("preview-item-vendor");
        const descEl = document.getElementById("preview-item-desc");
        const specsTableEl = document.getElementById("preview-specs-table");

        if (titleEl) titleEl.innerText = data.name || "Selected Component";
        if (partEl) partEl.innerText = data.part_no || data.id;
        if (vendorEl) vendorEl.innerText = data.vendor || "Thorlabs";
        if (descEl) descEl.innerText = data.description || "";

        if (specsTableEl) {
            let html = "";
            if (data.clear_aperture_mm) {
                html += `<tr><td>Clear Aperture:</td><td><strong>Ø${data.clear_aperture_mm} mm</strong></td></tr>`;
            }
            if (data.wavelength_nm) {
                html += `<tr><td>Laser Wavelength:</td><td><strong>${data.wavelength_nm} nm</strong></td></tr>`;
            }
            if (data.focal_length_mm) {
                html += `<tr><td>Focal Length:</td><td><strong>f = ${data.focal_length_mm} mm</strong></td></tr>`;
            }
            if (data.tube_lens_focal_mm) {
                html += `<tr><td>Tube Lens:</td><td><strong>f = ${data.tube_lens_focal_mm} mm</strong></td></tr>`;
            }
            if (data.pinhole_diameter_um) {
                html += `<tr><td>Pinhole Size:</td><td><strong>Ø${data.pinhole_diameter_um} µm (1 AU)</strong></td></tr>`;
            }
            if (data.dimensions) {
                const d = data.dimensions;
                html += `<tr><td>Dimensions (WxHxL):</td><td>${d.width} × ${d.height} × ${d.length} mm</td></tr>`;
            }
            if (data.post_stack) {
                const ps = data.post_stack;
                html += `<tr><td>Mounting Stack:</td><td>${ps.base} + ${ps.post_holder || 'Direct'} + ${ps.post || 'None'}</td></tr>`;
            }
            specsTableEl.innerHTML = html;
        }
    }

    animate() {
        this.animationFrameId = requestAnimationFrame(this.animate);

        if (this.currentMeshGroup && this.autoRotate) {
            this.currentMeshGroup.rotation.y += 0.008;
        }

        if (this.controls) {
            this.controls.update();
        }

        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    }

    destroy() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
        if (this.renderer && this.renderer.domElement && this.renderer.domElement.parentNode) {
            this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
        }
    }
}

window.ComponentPreviewViewport = ComponentPreviewViewport;
