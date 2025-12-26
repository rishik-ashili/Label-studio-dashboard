
// Mock XrayDetector
const XRAY_TYPES = {
    'IOPA': ['iopa'],
    'OPG': ['opg'],
    'Bitewing': ['bitewing']
};

const detectXrayType = (projectTitle) => {
    if (!projectTitle) return 'Others';
    const titleLower = projectTitle.toLowerCase();
    for (const [xrayType, keywords] of Object.entries(XRAY_TYPES)) {
        for (const keyword of keywords) {
            if (titleLower.includes(keyword)) {
                return xrayType;
            }
        }
    }
    return 'Others';
};

// Mock Data
const mockProjects = [
    { id: 1, title: 'Project 1 - IOPA' },
    { id: 2, title: 'Project 2 (IOPA)' },
    { id: 3, title: 'Project 3 - iopa studies' },
    { id: 4, title: 'Project 4 - IOPA' }
];

const mockPersistentDB = {
    "1": { history: [{ metrics: { pulp: { image_count: 50 } } }] },
    "2": { history: [{ metrics: { pulp: { image_count: 50 } } }] },
    "3": { history: [{ metrics: { pulp: { image_count: 50 } } }] },
    "4": { history: [{ metrics: { pulp: { image_count: 50 } } }] }
};

// Logic Simulation
async function simulateAddClassCheckpoint(className, xrayType) {
    console.log(`Simulating Checkpoint for ${className} (${xrayType})`);

    let totalImages = 0;

    for (const project of mockProjects) {
        const title = project.title || '';
        const detectedType = detectXrayType(title);

        console.log(`Project ${project.id}: "${title}" -> Detected: ${detectedType}`);

        if (detectedType !== xrayType) {
            console.log(`  SKIPPING: Type mismatch`);
            continue;
        }

        const history = mockPersistentDB[String(project.id)]?.history || [];
        if (history.length > 0) {
            const latest = history[history.length - 1];
            // Simulate loose matching for class name in metrics? 
            // The original code used exact match: `latest.metrics?.[className]`
            // BUT metrics keys are usually lowercase "pulp"
            // className argument is likely "Pulp" (Capitalized)

            const metrics = latest.metrics?.[className];
            const lowerMetrics = latest.metrics?.[className.toLowerCase()];

            if (metrics) {
                console.log(`  Found exact match "${className}": ${metrics.image_count}`);
                totalImages += metrics.image_count || 0;
            } else if (lowerMetrics) {
                console.log(`  Found lowercase match "${className.toLowerCase()}": ${lowerMetrics.image_count}`);
                // Original code DOES NOT check lowercase!
                console.log(`  (Original code would MISS this if it only checks exact key)`);
            } else {
                console.log(`  No metrics found for ${className}`);
            }
        }
    }

    console.log(`Total Images Calculated: ${totalImages}`);
}

simulateAddClassCheckpoint('Pulp', 'IOPA');
