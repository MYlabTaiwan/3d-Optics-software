/**
 * OptiPath 3D - Real-time 3D Optical Beam Raytracer
 * Calculates beam propagation, mirror reflections, beamsplitter paths,
 * periscope elevation shifts, and clear aperture clipping detection.
 */

class OpticalRaytracer {
    constructor(benchScene) {
        this.benchScene = benchScene;
        this.beamGroup = benchScene.beamGroup;
        this.maxBounces = 12;
        this.laserBeams = [];
        this.clippingAlerts = [];
        this.totalOpticalPathLength = 0;
    }

    /**
     * Clears existing beam meshes and re-traces all active laser paths
     */
    updateBeams() {
        this.clearBeams();
        this.clippingAlerts = [];
        this.totalOpticalPathLength = 0;
        this.detectedSignals = [];
        this.signalDetected = false;

        // Force complete world transform matrix sync before raytracing
        if (this.benchScene && this.benchScene.scene) {
            this.benchScene.scene.updateMatrixWorld(true);
        }

        const components = this.benchScene.placedComponents;
        // Reset beamInfo on all components
        components.forEach(c => { c.beamInfo = null; });

        const sources = components.filter(c => c.data.type === "laser_source");

        if (sources.length === 0) {
            this.updateTelemetry();
            return;
        }

        // Trace from each laser source
        sources.forEach(source => {
            const startPos = new THREE.Vector3();
            source.mesh.getWorldPosition(startPos);

            // Forward direction of laser source
            const dir = new THREE.Vector3(0, 0, 1);
            dir.applyEuler(source.mesh.rotation).normalize();

            // Offset to exit aperture
            const halfLen = (source.data.dimensions ? source.data.dimensions.length : 60) / 2;
            startPos.addScaledVector(dir, halfLen + 5);

            const wavelength = source.data.wavelength_nm || 532;
            const waist = (source.data.beam_diameter_mm || 2.0) / 2;
            const beamColor = source.data.color_hex || "#00FF41";

            this.traceRay(startPos, dir, wavelength, waist, beamColor, 1.0, 0, [], false);
        });

        this.updateTelemetry();
    }

    /**
     * Dichroic physics: longpass reflects wavelengths BELOW cut-on and transmits above;
     * shortpass transmits below cut-on and reflects above.
     */
    dichroicReflects(comp, wavelength) {
        const cut = comp.data.cut_on_wavelength_nm || 538.0;
        const mode = comp.data.dichroic_mode || "longpass";
        return mode === "shortpass" ? wavelength > cut : wavelength < cut;
    }

    traceRay(startPos, direction, wavelength, waist, colorHex, intensity, bounceDepth, pathHistory = [], isRetroRay = false) {
        if (bounceDepth >= this.maxBounces || intensity < 0.05) return;

        let closestHit = null;
        let minDistance = 2500; // Max ray travel if no hit
        let hitNormal = new THREE.Vector3();

        const components = this.benchScene.placedComponents;

        // Find closest intersecting optical element
        for (const comp of components) {
            const compType = comp.data.type;

            // Specialized port testing for Microscope Frames (Zeiss Axio Imager, Olympus IX73, etc.)
            if (compType === "microscope_frame") {
                const portConfig = comp.data.port_configuration || { top_port: "laser_in", left_port: "camera", rear_port: "laser_in" };

                // 1. Test Top Phototube Port (Overhead Laser Injection, Y ~ 234mm local)
                if (portConfig.top_port === "laser_in") {
                    const topPortWorld = comp.mesh.localToWorld(new THREE.Vector3(0, 234, -35));
                    const toTopPort = new THREE.Vector3().subVectors(topPortWorld, startPos);
                    const projTop = toTopPort.dot(direction);

                    if (projTop > 10.0 && projTop < minDistance) {
                        const hitPt = new THREE.Vector3().addVectors(startPos, direction.clone().multiplyScalar(projTop));
                        const perpDist = hitPt.distanceTo(topPortWorld);
                        if (perpDist <= 32.0) {
                            minDistance = projTop;
                            closestHit = {
                                component: comp,
                                hitPoint: hitPt,
                                distance: projTop,
                                perpDist: perpDist,
                                apertureRadius: 16.0,
                                portHit: "top_port"
                            };
                            hitNormal = new THREE.Vector3(0, 1, 0).applyEuler(comp.mesh.rotation).normalize();
                        }
                    }
                }

                // 2. Test Rear Laser / Epi Port
                if (portConfig.rear_port === "laser_in") {
                    const rearPortWorld = comp.mesh.localToWorld(new THREE.Vector3(0, 50, -196));
                    // Also check standard 100mm bench centerline height
                    const rearPortNominal = new THREE.Vector3(rearPortWorld.x, 100.0, rearPortWorld.z);
                    
                    const toRearPort = new THREE.Vector3().subVectors(rearPortNominal, startPos);
                    const projRear = toRearPort.dot(direction);

                    if (projRear > 10.0 && projRear < minDistance) {
                        const hitPt = new THREE.Vector3().addVectors(startPos, direction.clone().multiplyScalar(projRear));
                        const perpDist = Math.min(hitPt.distanceTo(rearPortNominal), hitPt.distanceTo(rearPortWorld));
                        if (perpDist <= 45.0) {
                            minDistance = projRear;
                            closestHit = {
                                component: comp,
                                hitPoint: hitPt,
                                distance: projRear,
                                perpDist: perpDist,
                                apertureRadius: 20.0,
                                portHit: "rear_port"
                            };
                            hitNormal = new THREE.Vector3(0, 0, -1).applyEuler(comp.mesh.rotation).normalize();
                        }
                    }
                }

                continue;
            }

            const compPos = new THREE.Vector3();
            comp.mesh.getWorldPosition(compPos);

            // Optical Center: True 3D world position of component
            const optCenter = compPos.clone();

            // Vector from startPos to optical center
            const toOptic = new THREE.Vector3().subVectors(optCenter, startPos);
            const projDist = toOptic.dot(direction);

            // Must be forward along ray and not the source itself at start
            if (projDist > 10.0 && projDist < minDistance) {
                // Perpendicular distance to beam line
                const closestPointOnRay = new THREE.Vector3().addVectors(startPos, direction.clone().multiplyScalar(projDist));
                const perpDist = closestPointOnRay.distanceTo(optCenter);

                let clearAperture = (comp.data.clear_aperture_mm || 25.4) / 2;
                if (compType === "detector_spectro") clearAperture = 70.0;
                else if (compType === "camera") clearAperture = 45.0;

                if (perpDist <= clearAperture + 14.0) {
                    minDistance = projDist;
                    closestHit = {
                        component: comp,
                        hitPoint: closestPointOnRay,
                        distance: projDist,
                        perpDist: perpDist,
                        apertureRadius: clearAperture
                    };

                    // Normal vector based on component rotation and internal geometry
                    if (compType === "dichroic_cube" || compType === "beamsplitter_cube") {
                        // 45-degree internal diagonal plate inside the cube
                        if (Math.abs(direction.x) > 0.5) {
                            const nx = direction.x > 0 ? -1 : 1;
                            hitNormal = new THREE.Vector3(nx, 0, 1).normalize().applyEuler(comp.mesh.rotation).normalize();
                        } else {
                            const nz = direction.z > 0 ? -1 : 1;
                            hitNormal = new THREE.Vector3(1, 0, nz).normalize().applyEuler(comp.mesh.rotation).normalize();
                        }
                    } else {
                        // Support tilted optic head (e.g. overhead fold mirrors with grounded vertical post)
                        const opticHead = comp.mesh.getObjectByName("optic_head");
                        if (opticHead && (opticHead.rotation.x !== 0 || opticHead.rotation.z !== 0)) {
                            hitNormal = new THREE.Vector3(0, 0, -1).applyEuler(opticHead.rotation).applyEuler(comp.mesh.rotation).normalize();
                        } else {
                            hitNormal = new THREE.Vector3(0, 0, -1).applyEuler(comp.mesh.rotation).normalize();
                        }
                    }
                }
            }
        }

        const endPos = closestHit ? closestHit.hitPoint : startPos.clone().addScaledVector(direction, minDistance);
        const segmentLen = startPos.distanceTo(endPos);
        this.totalOpticalPathLength += segmentLen;

        // Render 3D Beam Cylinder
        this.renderBeamSegment(startPos, endPos, waist, colorHex, intensity);

        // Process optical interaction at hit
        if (closestHit) {
            const comp = closestHit.component;
            const compType = comp.data.type;

            const currentStep = {
                startPos: startPos.clone(),
                endPos: endPos.clone(),
                direction: direction.clone(),
                component: comp,
                hitNormal: hitNormal.clone(),
                portHit: closestHit.portHit || null
            };
            const newHistory = [...pathHistory, currentStep];

            // Check clipping
            if (closestHit.perpDist > closestHit.apertureRadius * 0.75) {
                this.clippingAlerts.push({
                    componentName: comp.data.name,
                    ratio: (closestHit.perpDist / closestHit.apertureRadius * 100).toFixed(0),
                    beamRadius: waist.toFixed(1),
                    aperture: (closestHit.apertureRadius * 2).toFixed(1)
                });
            }

            // Record hit information on the component
            comp.beamInfo = {
                hitPoint: endPos.clone(),
                incidentDir: direction.clone(),
                hitNormal: hitNormal.clone(),
                isHit: true
            };

            // 1. MIRRORS & KINEMATIC FLIP MIRRORS (TRF90)
            if (compType === "mirror" || compType === "flip_mirror" || comp.data.is_flip_mirror) {
                const reflDir = this.reflectVector(direction, hitNormal);
                comp.beamInfo.reflectedRay = reflDir.clone();
                comp.beamInfo.straightRay = direction.clone();

                if (comp.data.is_flip_mirror || compType === "flip_mirror") {
                    if (comp.data.flip_state === "bypassed") {
                        // Flipped down / bypassed: beam passes straight horizontally without deflection!
                        comp.beamInfo.exitRay = direction.clone();
                        this.traceRay(endPos, direction.clone(), wavelength, waist, colorHex, intensity * 0.99, bounceDepth + 1, newHistory, isRetroRay);
                    } else {
                        // Engaged: 90° perpendicular reflection!
                        comp.beamInfo.exitRay = reflDir.clone();
                        this.traceRay(endPos, reflDir, wavelength, waist * 1.02, colorHex, intensity * 0.98, bounceDepth + 1, newHistory, isRetroRay);
                    }
                } else {
                    comp.beamInfo.exitRay = reflDir.clone();
                    this.traceRay(endPos, reflDir, wavelength, waist * 1.02, colorHex, intensity * 0.98, bounceDepth + 1, newHistory, isRetroRay);
                }
            }
            // 2. BEAMSPLITTER CUBE & DICHROIC CUBE
            else if (compType === "beamsplitter_cube" || compType === "dichroic_cube") {
                const reflDir = this.reflectVector(direction, hitNormal);
                comp.beamInfo.reflectedRay = reflDir.clone();
                comp.beamInfo.straightRay = direction.clone();
                comp.beamInfo.exitRay = reflDir.clone();

                if (compType === "dichroic_cube") {
                    if (isRetroRay) {
                        // In retro-path, Stokes Raman emission (>535nm)
                        // Trace both transmitted and reflected branches to reach detector arm regardless of branch orientation
                        comp.beamInfo.exitRay = reflDir.clone();
                        this.traceRay(endPos, reflDir, wavelength, waist * 1.15, colorHex, intensity * 0.95, bounceDepth + 1, newHistory, true);
                        this.traceRay(endPos, direction.clone(), wavelength, waist * 1.15, colorHex, intensity * 0.95, bounceDepth + 1, newHistory, true);
                    } else if (this.dichroicReflects(comp, wavelength)) {
                        // Excitation laser is inside the reflection band: reflects 90 degrees into periscope / microscope
                        this.traceRay(endPos, reflDir, wavelength, waist, colorHex, intensity * 0.95, bounceDepth + 1, newHistory, false);
                    } else {
                        // Laser is inside the transmission band of this insert: it passes straight through (wrong DM for this line)
                        comp.beamInfo.exitRay = direction.clone();
                        this.clippingAlerts.push({
                            componentName: `${comp.data.name} TRANSMITS ${wavelength} nm (wrong dichroic insert)`,
                            ratio: ">100",
                            beamRadius: waist.toFixed(1),
                            aperture: "-"
                        });
                        this.traceRay(endPos, direction.clone(), wavelength, waist, colorHex, intensity * 0.95, bounceDepth + 1, newHistory, false);
                    }
                } else {
                    // 50:50 / PBS split
                    this.traceRay(endPos, direction.clone(), wavelength, waist, colorHex, intensity * 0.5, bounceDepth + 1, newHistory, isRetroRay);
                    this.traceRay(endPos, reflDir, wavelength, waist, colorHex, intensity * 0.5, bounceDepth + 1, newHistory, isRetroRay);
                }
            }
            // 3. LENS (FOCUSING / DIVERGING)
            else if (compType === "lens") {
                const f = comp.data.focal_length_mm || 100;
                comp.beamInfo.exitRay = direction.clone();
                comp.beamInfo.straightRay = direction.clone();
                this.traceRay(endPos, direction.clone(), wavelength, Math.max(0.2, waist * 0.8), colorHex, intensity * 0.96, bounceDepth + 1, newHistory, isRetroRay);
            }
            // 4. CONFOCAL PINHOLE, FILTERS, APERTURES & POLARIZING OPTICS (HWP, QWP, POLARIZERS)
            else if (compType === "confocal_pinhole" || compType.startsWith("filter_") || compType === "iris" ||
                     compType === "waveplate_hwp" || compType === "waveplate_qwp" || compType === "polarizer") {
                // Laser clean-up (line) filters only transmit their design wavelength
                if (compType === "filter_bandpass" && comp.data.center_wavelength_nm && comp.data.bandwidth_nm) {
                    if (Math.abs(wavelength - comp.data.center_wavelength_nm) > Math.max(comp.data.bandwidth_nm, 2.0)) {
                        comp.beamInfo.blocked = true;
                        this.clippingAlerts.push({
                            componentName: `${comp.data.name} BLOCKS ${wavelength} nm`,
                            ratio: ">100",
                            beamRadius: waist.toFixed(1),
                            aperture: "-"
                        });
                        return;
                    }
                }
                comp.beamInfo.exitRay = direction.clone();
                comp.beamInfo.straightRay = direction.clone();
                this.traceRay(endPos, direction.clone(), wavelength, waist, colorHex, intensity * 0.96, bounceDepth + 1, newHistory, isRetroRay);
            }
            // 5. PERISCOPE (HEIGHT ELEVATION & OPTIONAL OVERHEAD CAGE ARM)
            else if (comp.data.is_periscope || compType === "cage_periscope" || compType === "periscope") {
                const deltaY = comp.data.elevation_delta_mm || 100;
                const elevatedPos = endPos.clone();
                elevatedPos.y += deltaY;

                // Vertical column ray
                this.renderBeamSegment(endPos, elevatedPos, waist, colorHex, intensity * 0.95);

                if (comp.data.has_overhead_arm || comp.data.overhead_arm_length_mm) {
                    const armLen = comp.data.overhead_arm_length_mm || 195;
                    const foldPos = elevatedPos.clone().addScaledVector(direction, armLen);
                    // Horizontal overhead beam along 30mm cage arm
                    this.renderBeamSegment(elevatedPos, foldPos, waist, colorHex, intensity * 0.95);

                    // Downward reflection from fold cube mirror directly into microscope top phototube
                    const downDir = new THREE.Vector3(0, -1, 0);
                    newHistory.push({ component: comp, startPos: elevatedPos.clone(), endPos: foldPos.clone(), direction: direction.clone() });
                    this.traceRay(foldPos, downDir, wavelength, waist, colorHex, intensity * 0.92, bounceDepth + 1, newHistory, isRetroRay);
                } else {
                    // Exit ray (forward at new height)
                    this.traceRay(elevatedPos, direction.clone(), wavelength, waist, colorHex, intensity * 0.92, bounceDepth + 1, newHistory, isRetroRay);
                }
            }
            // 6. MICROSCOPE FRAME ENTRY & RETRO-COLLECTION (TOP/REAR INJECTION -> OBJECTIVE -> SAMPLE -> RETRO DM -> SPECTROMETER)
            else if (compType === "microscope_frame") {
                const portConfig = comp.data.port_configuration || {
                    top_port: "laser_in",
                    left_port: "camera",
                    rear_port: "laser_in",
                    retro_route: "retro_dm"
                };

                const stageWorld = comp.mesh.localToWorld(new THREE.Vector3(0, -25, 20));

                // A. Excitation laser focuses through objective onto specimen stage
                if (closestHit.portHit === "top_port") {
                    this.renderBeamSegment(endPos, stageWorld, waist * 0.4, colorHex, intensity * 0.95);
                } else if (closestHit.portHit === "rear_port") {
                    const dichroicWorld = comp.mesh.localToWorld(new THREE.Vector3(0, 50, -30));
                    this.renderBeamSegment(endPos, dichroicWorld, waist, colorHex, intensity * 0.95);
                    this.renderBeamSegment(dichroicWorld, stageWorld, waist * 0.4, colorHex, intensity * 0.95);
                } else {
                    this.renderBeamSegment(endPos, stageWorld, waist * 0.5, "#00d2ff", intensity * 0.9);
                }

                // B. RETRO-COLLECTION / EPI-EMISSION PATH
                const retroMode = comp.data.retro_route || portConfig.retro_route || "retro_dm";

                if (retroMode === "retro_dm" && !isRetroRay) {
                    const retroColor = comp.data.retro_color || "#ff00d4"; // Stokes Raman Magenta
                    const retroWavelength = comp.data.retro_wavelength || 580.0;

                    // 1. Emission light from sample collimates back up through objective to entrance port
                    this.renderBeamSegment(stageWorld, endPos, waist * 0.85, retroColor, intensity * 0.95);

                    // 2. Locate the Dichroic Mirror / Cube (DM) in pathHistory
                    let dmIndex = -1;
                    for (let i = newHistory.length - 1; i >= 0; i--) {
                        const hComp = newHistory[i].component;
                        if (hComp && (hComp.data.type === "dichroic_cube" || hComp.data.type === "beamsplitter_cube" || hComp.catalog_id?.includes("DICHROIC"))) {
                            dmIndex = i;
                            break;
                        }
                    }

                    if (dmIndex >= 0) {
                        // 3. Trace backward along the exact path from microscope entrance to the DM
                        // (Traverses 90° steering mirrors, elevated decks, and down periscopes)
                        for (let i = newHistory.length - 1; i > dmIndex; i--) {
                            const step = newHistory[i];
                            this.renderBeamSegment(step.endPos, step.startPos, waist * 1.15, retroColor, intensity * 0.92);

                            // If this step was a periscope, trace the vertical column in reverse (downward)
                            // The periscope is located at step.endPos (NOT step.startPos which is the Dichroic Cube!)
                            if (step.component && (step.component.data.is_periscope || step.component.data.type === "cage_periscope" || step.component.data.type === "periscope")) {
                                const elevDelta = step.component.data.elevation_delta_mm || 100;
                                const colBottom = step.endPos.clone();
                                const colTop = step.endPos.clone();
                                colTop.y += elevDelta;
                                this.renderBeamSegment(colTop, colBottom, waist * 1.15, retroColor, intensity * 0.90);
                            }
                        }

                        // 4. Arrive at the Dichroic Mirror (DM)
                        const dmStep = newHistory[dmIndex];
                        const dmHitPos = dmStep.endPos.clone();

                        // 5. Physics of Dichroic Mirror Separation:
                        // Stokes Raman emission (580nm > 535nm) is separated from 532nm laser
                        // and reflects cleanly 90° into the Raman detection arm along +X axis
                        // (Confocal Pinhole -> Raman Edge Filter -> Princeton Spectrometer)
                        // It does NOT exit through the solid top cap (+Y) nor back into the laser (-X)!
                        const detectionDir = new THREE.Vector3(1, 0, 0);
                        this.traceRay(dmHitPos, detectionDir, retroWavelength, waist * 1.25, retroColor, intensity * 0.88, 0, [], true);
                    } else {
                        // Fallback: If no DM is in path, route to left side TV port or camera
                        if (portConfig.left_port === "camera" || portConfig.left_port === "spectrometer") {
                            const splitterWorld = comp.mesh.localToWorld(new THREE.Vector3(0, 135, -20));
                            const leftPortWorld = comp.mesh.localToWorld(new THREE.Vector3(-115, 135, -20));
                            const leftPortDir = new THREE.Vector3(-1, 0, 0).applyEuler(comp.mesh.rotation).normalize();

                            this.renderBeamSegment(stageWorld, splitterWorld, waist * 0.6, retroColor, intensity * 0.85);
                            this.renderBeamSegment(splitterWorld, leftPortWorld, waist * 0.8, retroColor, intensity * 0.85);

                            if (portConfig.left_port === "spectrometer") {
                                this.traceRay(leftPortWorld, leftPortDir, retroWavelength, waist * 1.2, retroColor, intensity * 0.75, 0, [], true);
                            }
                        }
                    }
                } else if (retroMode === "side_port") {
                    // Direct side port emission routing
                    const splitterWorld = comp.mesh.localToWorld(new THREE.Vector3(0, 135, -20));
                    const leftPortWorld = comp.mesh.localToWorld(new THREE.Vector3(-115, 135, -20));
                    const leftPortDir = new THREE.Vector3(-1, 0, 0).applyEuler(comp.mesh.rotation).normalize();

                    this.renderBeamSegment(stageWorld, splitterWorld, waist * 0.6, "#ff00d4", intensity * 0.85);
                    this.renderBeamSegment(splitterWorld, leftPortWorld, waist * 0.8, "#ff00d4", intensity * 0.85);

                    if (portConfig.left_port === "spectrometer") {
                        this.traceRay(leftPortWorld, leftPortDir, 580, waist * 1.2, "#ff00d4", intensity * 0.75, 0, [], true);
                    }
                }
            }
            // 7. SPECTROMETERS (PRINCETON ISOPLANE / ANDOR SHAMROCK)
            else if (compType === "detector_spectro") {
                comp.beamInfo.exitRay = null;
                comp.beamInfo.isHit = true;
                comp.beamInfo.detected = true;
                this.signalDetected = true;
                this.detectedSignals.push({
                    detector: comp.data.name,
                    wavelength: wavelength,
                    intensity: intensity,
                    type: "Spectrometer (Czerny-Turner Dispersed)"
                });

                // Internal 3D ray path: Entrance Slit -> Collimator -> Grating Turret -> CCD Sensor
                const slitWorld = endPos.clone();
                const colWorld = comp.mesh.localToWorld(new THREE.Vector3(40, 0, -35));
                const gratWorld = comp.mesh.localToWorld(new THREE.Vector3(0, 15, 0));
                const ccdWorld = comp.mesh.localToWorld(new THREE.Vector3(0, 0, 95));

                this.renderBeamSegment(slitWorld, colWorld, waist * 0.75, colorHex, intensity);
                this.renderBeamSegment(colWorld, gratWorld, waist * 1.35, colorHex, intensity);

                // Multi-wavelength spectral dispersion fan onto CCD
                this.renderBeamSegment(gratWorld, ccdWorld.clone().add(new THREE.Vector3(-10, 0, 0)), waist * 0.35, "#00d2ff", intensity * 0.85); // Blue
                this.renderBeamSegment(gratWorld, ccdWorld.clone().add(new THREE.Vector3(-4, 0, 0)), waist * 0.35, "#00ff88", intensity * 0.9);  // Green
                this.renderBeamSegment(gratWorld, ccdWorld.clone(), waist * 0.45, colorHex, intensity * 0.95);                                   // Stokes Peak
                this.renderBeamSegment(gratWorld, ccdWorld.clone().add(new THREE.Vector3(6, 0, 0)), waist * 0.35, "#ffaa00", intensity * 0.85);  // Gold / Stokes
                this.renderBeamSegment(gratWorld, ccdWorld.clone().add(new THREE.Vector3(12, 0, 0)), waist * 0.35, "#ff3366", intensity * 0.8);  // Red
            }
            // 8. CCD / EMCCD CAMERAS (ANDOR IXON / ZEISS AXIOCAM)
            else if (compType === "camera") {
                comp.beamInfo.exitRay = null;
                comp.beamInfo.isHit = true;
                comp.beamInfo.detected = true;
                this.signalDetected = true;
                this.detectedSignals.push({
                    detector: comp.data.name,
                    wavelength: wavelength,
                    intensity: intensity,
                    type: "Direct Imaging / CCD"
                });

                const sensorWorld = comp.mesh.localToWorld(new THREE.Vector3(0, 0, 0));
                this.renderBeamSegment(endPos, sensorWorld, waist * 0.35, colorHex, intensity);
            }
        }
    }

    reflectVector(incidentDir, surfaceNormal) {
        const n = surfaceNormal.clone().normalize();
        const d = incidentDir.clone().normalize();
        // If normal points along the ray, invert it so reflection is always off the surface
        if (d.dot(n) > 0) {
            n.negate();
        }
        // Law of reflection: r = d - 2*(d . n)*n
        const dot = d.dot(n);
        return d.clone().sub(n.multiplyScalar(2.0 * dot)).normalize();
    }

    renderBeamSegment(start, end, radius, colorHex, intensity) {
        const distance = start.distanceTo(end);
        if (distance < 1.0) return;

        const cylGeo = new THREE.CylinderGeometry(radius, radius * 1.02, distance, 16);
        cylGeo.rotateX(Math.PI / 2);

        // Core bright laser beam
        const coreMat = new THREE.MeshBasicMaterial({
            color: new THREE.Color(colorHex),
            transparent: true,
            opacity: Math.min(1.0, 0.75 * intensity)
        });
        const coreMesh = new THREE.Mesh(cylGeo, coreMat);

        // Outer glowing halo
        const haloGeo = new THREE.CylinderGeometry(radius * 2.5, radius * 2.5, distance, 16);
        haloGeo.rotateX(Math.PI / 2);
        const haloMat = new THREE.MeshBasicMaterial({
            color: new THREE.Color(colorHex),
            transparent: true,
            opacity: Math.min(0.4, 0.22 * intensity),
            blending: THREE.AdditiveBlending
        });
        const haloMesh = new THREE.Mesh(haloGeo, haloMat);

        const group = new THREE.Group();
        group.add(coreMesh, haloMesh);

        // Position and orient cylinder between start and end
        const midPoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
        group.position.copy(midPoint);
        group.lookAt(end);

        this.beamGroup.add(group);
        this.laserBeams.push(group);
    }

    clearBeams() {
        while (this.laserBeams.length > 0) {
            const b = this.laserBeams.pop();
            this.beamGroup.remove(b);
            b.traverse(c => {
                if (c.geometry) c.geometry.dispose();
                if (c.material) c.material.dispose();
            });
        }
    }

    updateTelemetry() {
        const pathLenEl = document.getElementById("telem-path-length");
        const clipsEl = document.getElementById("telem-clipping-count");
        const warningBadge = document.getElementById("clipping-warning-badge");

        if (pathLenEl) {
            pathLenEl.innerText = `${(this.totalOpticalPathLength / 10).toFixed(1)} cm`;
        }

        if (clipsEl) {
            clipsEl.innerText = `${this.clippingAlerts.length} Warnings`;
        }

        if (warningBadge) {
            if (this.clippingAlerts.length > 0) {
                warningBadge.style.display = "inline-flex";
                warningBadge.title = this.clippingAlerts.map(a => `${a.componentName}: ${a.ratio}% aperture used`).join('\n');
            } else {
                warningBadge.style.display = "none";
            }
        }

        const detectEl = document.getElementById("telem-detection-status");
        if (detectEl) {
            if (this.detectedSignals && this.detectedSignals.length > 0) {
                const s = this.detectedSignals[0];
                detectEl.innerHTML = `<span style="color: #ff00d4; font-weight: 700;">● ${s.detector}</span> (${s.wavelength}nm ${s.type})`;
            } else {
                detectEl.innerHTML = `<span style="color: var(--text-muted)">Awaiting signal</span>`;
            }
        }
    }

    /**
     * Resolves the outgoing beam vector and starting point for a given component.
     * Used for sequential optical insertion ('Add After M1').
     * @param {Object} comp - Placed component instance
     * @param {string} branch - 'primary' (default exit), 'perpendicular' (90° reflected), or 'straight' (pass-through)
     * @returns {Object} { startPoint: Vector3, direction: Vector3, isReflected: boolean }
     */
    getExitBeam(comp, branch = "primary") {
        if (!comp) return null;

        const pos = comp.mesh.position.clone();
        const fwd = new THREE.Vector3(0, 0, 1).applyEuler(comp.mesh.rotation).normalize();

        // 1. If active laser beam has struck this component, use simulated physics ray
        if (comp.beamInfo && comp.beamInfo.hitPoint) {
            let dir = comp.beamInfo.exitRay ? comp.beamInfo.exitRay.clone() : fwd.clone();

            if (branch === "straight" && comp.beamInfo.straightRay) {
                dir = comp.beamInfo.straightRay.clone();
            } else if (branch === "perpendicular" && comp.beamInfo.reflectedRay) {
                dir = comp.beamInfo.reflectedRay.clone();
            }

            return {
                startPoint: comp.beamInfo.hitPoint.clone(),
                direction: dir.normalize(),
                isReflected: branch === "perpendicular" || (branch === "primary" && !!comp.beamInfo.reflectedRay)
            };
        }

        // 2. Geometric fallback if beam hasn't hit component yet
        const type = comp.data.type;
        const isMirror = type === "mirror" || type === "flip_mirror" || comp.data.is_flip_mirror;

        if (isMirror) {
            if (branch === "straight") {
                return { startPoint: pos, direction: fwd, isReflected: false };
            } else {
                // Perpendicular 90° reflection
                const reflDir = new THREE.Vector3(1, 0, 0).applyEuler(comp.mesh.rotation).normalize();
                return { startPoint: pos, direction: reflDir, isReflected: true };
            }
        }

        return { startPoint: pos, direction: fwd, isReflected: false };
    }
}

window.OpticalRaytracer = OpticalRaytracer;
