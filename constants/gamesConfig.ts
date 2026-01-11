
import React from 'react';
import { 
    LayoutGrid, Globe, Gamepad2, Puzzle, Trophy, Hexagon, 
    Crosshair, Activity, Rocket, Ghost, Wind, Brain, 
    BrainCircuit, Sparkles, Ship, Crown, Search
} from 'lucide-react';

// --- CUSTOM ICONS ---
export const CustomUltraRunnerIcon = ({ size = "100%", className = "" }: { size?: number | string, className?: string }) => 
    React.createElement("svg", { width: size, height: size, viewBox: "0 0 512 512", fill: "none", xmlns: "http://www.w3.org/2000/svg", className },
      React.createElement("defs", null,
        React.createElement("filter", { id: "nr-neonGlow", x: "-200%", y: "-200%", width: "500%", height: "500%" },
          React.createElement("feGaussianBlur", { stdDeviation: "15", result: "blur" }),
          React.createElement("feComposite", { in: "SourceGraphic", in2: "blur", operator: "over" })
        ),
        React.createElement("linearGradient", { id: "nr-cubeGrad", x1: "0%", y1: "0%", x2: "100%", y2: "100%" },
          React.createElement("stop", { offset: "0%", stopColor: "#22D3EE" }),
          React.createElement("stop", { offset: "100%", stopColor: "#0891B2" })
        ),
        React.createElement("linearGradient", { id: "nr-dangerGrad", x1: "0%", y1: "0%", x2: "100%", y2: "100%" },
          React.createElement("stop", { offset: "0%", stopColor: "#F43F5E" }),
          React.createElement("stop", { offset: "100%", stopColor: "#9F1239" })
        ),
        React.createElement("linearGradient", { id: "nr-shineGrad", x1: "0%", y1: "0%", x2: "100%", y2: "100%" },
          React.createElement("stop", { offset: "0%", stopColor: "white", stopOpacity: "0.5" }),
          React.createElement("stop", { offset: "50%", stopColor: "white", stopOpacity: "0.1" }),
          React.createElement("stop", { offset: "100%", stopColor: "white", stopOpacity: "0" })
        )
      ),
      React.createElement("rect", { width: "512", height: "512", rx: "108", fill: "#020617" }),
      React.createElement("path", { d: "M0 400 H512", stroke: "#22D3EE", strokeWidth: "4", opacity: "0.6", filter: "url(#nr-neonGlow)" }),
      React.createElement("path", { d: "M0 440 H512", stroke: "#22D3EE", strokeWidth: "1", opacity: "0.2" }),
      React.createElement("g", { stroke: "#22D3EE", strokeWidth: "1", opacity: "0.1" },
        React.createElement("line", { x1: "256", y1: "400", x2: "0", y2: "512" }),
        React.createElement("line", { x1: "256", y1: "400", x2: "128", y2: "512" }),
        React.createElement("line", { x1: "256", y1: "400", x2: "256", y2: "512" }),
        React.createElement("line", { x1: "256", y1: "400", x2: "384", y2: "512" }),
        React.createElement("line", { x1: "256", y1: "400", x2: "512", y2: "512" })
      ),
      React.createElement("g", { opacity: "0.4", filter: "url(#nr-neonGlow)" },
        React.createElement("rect", { x: "20", y: "240", width: "120", height: "4", rx: "2", fill: "#22D3EE" }),
        React.createElement("rect", { x: "60", y: "280", width: "80", height: "4", rx: "2", fill: "#22D3EE" }),
        React.createElement("rect", { x: "40", y: "320", width: "100", height: "4", rx: "2", fill: "#22D3EE" })
      ),
      React.createElement("g", { transform: "translate(360, 400)" },
        React.createElement("path", { d: "M-40 0 L0 -80 L40 0 Z", fill: "url(#nr-dangerGrad)", stroke: "#F43F5E", strokeWidth: "4", filter: "url(#nr-neonGlow)" }),
        React.createElement("path", { d: "M-20 0 L0 -40 L20 0 Z", fill: "white", opacity: "0.3" })
      ),
      React.createElement("g", { transform: "translate(180, 280) rotate(-15)" },
        React.createElement("rect", { x: "-60", y: "-60", width: "120", height: "120", rx: "12", stroke: "#22D3EE", strokeWidth: "15", filter: "url(#nr-neonGlow)", opacity: "0.4" }),
        React.createElement("rect", { x: "-60", y: "-60", width: "120", height: "120", rx: "12", fill: "url(#nr-cubeGrad)", stroke: "white", strokeWidth: "2" }),
        React.createElement("rect", { x: "-35", y: "-35", width: "20", height: "20", rx: "4", fill: "#020617" }),
        React.createElement("rect", { x: "15", y: "-35", width: "20", height: "20", rx: "4", fill: "#020617" }),
        React.createElement("rect", { x: "-35", y: "10", width: "70", height: "10", rx: "5", fill: "#020617" }),
        React.createElement("rect", { x: "-60", y: "-60", width: "120", height: "60", rx: "12", fill: "url(#nr-shineGrad)" })
      ),
      React.createElement("circle", { cx: "120", cy: "350", r: "3", fill: "#22D3EE", filter: "url(#nr-neonGlow)" }),
      React.createElement("circle", { cx: "90", cy: "370", r: "2", fill: "white", opacity: "0.6" }),
      React.createElement("circle", { cx: "450", cy: "100", r: "4", fill: "#F43F5E", filter: "url(#nr-neonGlow)", opacity: "0.3" }),
      React.createElement("rect", { x: "24", y: "24", width: "464", height: "464", rx: "104", stroke: "white", strokeOpacity: "0.05", strokeWidth: "4" })
    );

export const CustomUltraArenaIcon = ({ size = "100%", className = "" }: { size?: number | string, className?: string }) => 
    React.createElement("svg", { width: size, height: size, viewBox: "0 0 512 512", fill: "none", xmlns: "http://www.w3.org/2000/svg", className },
      React.createElement("defs", null,
        React.createElement("filter", { id: "ac-neonGlow", x: "-200%", y: "-200%", width: "500%", height: "500%" },
          React.createElement("feGaussianBlur", { stdDeviation: "15", result: "blur" }),
          React.createElement("feComposite", { in: "SourceGraphic", in2: "blur", operator: "over" })
        ),
        React.createElement("filter", { id: "ac-armorBevel" },
          React.createElement("feGaussianBlur", { stdDeviation: "2", result: "blur" }),
          React.createElement("feSpecularLighting", { surfaceScale: "5", specularConstant: "1", specularExponent: "40", lightingColor: "#ffffff", in: "blur", result: "spec" },
            React.createElement("fePointLight", { x: "-5000", y: "-10000", z: "20000" })
          ),
          React.createElement("feComposite", { in: "spec", in2: "SourceGraphic", operator: "in", result: "comp" }),
          React.createElement("feComposite", { in: "SourceGraphic", in2: "comp", operator: "over" })
        ),
        React.createElement("linearGradient", { id: "ac-tankBodyGrad", x1: "0%", y1: "0%", x2: "100%", y2: "100%" },
          React.createElement("stop", { offset: "0%", stopColor: "#334155" }),
          React.createElement("stop", { offset: "100%", stopColor: "#0F172A" })
        )
      ),
      React.createElement("rect", { width: "512", height: "512", rx: "108", fill: "#020617" }),
      React.createElement("g", { opacity: "0.1", stroke: "#22D3EE", strokeWidth: "1" },
        React.createElement("circle", { cx: "256", cy: "256", r: "240" }),
        React.createElement("line", { x1: "256", y1: "16", x2: "256", y2: "496" }),
        React.createElement("line", { x1: "16", y1: "256", x2: "496", y2: "256" })
      ),
      React.createElement("g", { id: "ac-tank-body", transform: "translate(256, 256)", filter: "url(#ac-armorBevel)" },
        React.createElement("rect", { x: "-80", y: "-100", width: "160", height: "200", rx: "12", stroke: "#22D3EE", strokeWidth: "20", filter: "url(#ac-neonGlow)", opacity: "0.15" }),
        React.createElement("rect", { x: "-90", y: "-110", width: "40", height: "220", rx: "8", fill: "#1E293B", stroke: "#22D3EE", strokeWidth: "2", opacity: "0.6" }),
        React.createElement("rect", { x: "50", y: "-110", width: "40", height: "220", rx: "8", fill: "#1E293B", stroke: "#22D3EE", strokeWidth: "2", opacity: "0.6" }),
        React.createElement("rect", { x: "-70", y: "-90", width: "140", height: "180", rx: "10", fill: "url(#ac-tankBodyGrad)", stroke: "#22D3EE", strokeWidth: "2" }),
        React.createElement("rect", { x: "-45", y: "-50", width: "90", height: "90", rx: "45", fill: "#0F172A", stroke: "#22D3EE", strokeWidth: "3" }),
        React.createElement("g", { transform: "translate(0, -45)" },
          React.createElement("rect", { x: "-12", y: "-110", width: "24", height: "120", rx: "4", fill: "url(#ac-tankBodyGrad)", stroke: "#22D3EE", strokeWidth: "2" }),
          React.createElement("circle", { cx: "0", cy: "-110", r: "15", fill: "#22D3EE", filter: "url(#ac-neonGlow)" }),
          React.createElement("circle", { cx: "0", cy: "-110", r: "8", fill: "white" })
        ),
        React.createElement("path", { d: "M-25 -25 A 30 30 0 0 1 10 -40", stroke: "white", strokeWidth: "3", strokeLinecap: "round", opacity: "0.3" })
      ),
      React.createElement("g", { transform: "translate(256, 100)" },
        React.createElement("circle", { r: "60", stroke: "#F43F5E", strokeWidth: "2", strokeDasharray: "10 5", filter: "url(#ac-neonGlow)" }),
        React.createElement("path", { d: "M-70 0 H-50 M50 0 H70 M0 -70 V-50 M0 50 V70", stroke: "#F43F5E", strokeWidth: "4", strokeLinecap: "round" }),
        React.createElement("circle", { r: "4", fill: "#F43F5E", filter: "url(#ac-neonGlow)" })
      ),
      React.createElement("circle", { cx: "80", cy: "80", r: "3", fill: "#22D3EE", filter: "url(#ac-neonGlow)" }),
      React.createElement("circle", { cx: "432", cy: "432", r: "3", fill: "#F43F5E", filter: "url(#ac-neonGlow)" }),
      React.createElement("rect", { x: "350", y: "450", width: "100", height: "6", rx: "3", fill: "#1E293B" }),
      React.createElement("rect", { x: "350", y: "450", width: "70", height: "6", rx: "3", fill: "#22D3EE", filter: "url(#ac-neonGlow)" }),
      React.createElement("rect", { x: "24", y: "24", width: "464", height: "464", rx: "104", stroke: "white", strokeOpacity: "0.05", strokeWidth: "4" })
    );

export const CustomUltraSudokuIcon = ({ size = "100%", className = "" }: { size?: number | string, className?: string }) => 
    React.createElement("svg", { width: size, height: size, viewBox: "0 0 512 512", fill: "none", xmlns: "http://www.w3.org/2000/svg", className },
      React.createElement("defs", null,
        React.createElement("filter", { id: "su-ultraGlow", x: "-200%", y: "-200%", width: "500%", height: "500%" },
          React.createElement("feGaussianBlur", { stdDeviation: "15", result: "blur" }),
          React.createElement("feComposite", { in: "SourceGraphic", in2: "blur", operator: "over" })
        ),
        React.createElement("filter", { id: "su-glassRefraction" },
          React.createElement("feGaussianBlur", { stdDeviation: "2", result: "blur" }),
          React.createElement("feSpecularLighting", { surfaceScale: "5", specularConstant: "1", specularExponent: "40", lightingColor: "#ffffff", in: "blur", result: "spec" },
            React.createElement("fePointLight", { x: "-5000", y: "-10000", z: "20000" })
          ),
          React.createElement("feComposite", { in: "spec", in2: "SourceGraphic", operator: "in", result: "comp" }),
          React.createElement("feComposite", { in: "SourceGraphic", in2: "comp", operator: "over" })
        ),
        React.createElement("linearGradient", { id: "su-logicCyan", x1: "0%", y1: "0%", x2: "100%", y2: "100%" },
          React.createElement("stop", { offset: "0%", stopColor: "#22D3EE" }),
          React.createElement("stop", { offset: "100%", stopColor: "#0891B2" })
        ),
        React.createElement("linearGradient", { id: "su-solveMagenta", x1: "0%", y1: "0%", x2: "100%", y2: "100%" },
          React.createElement("stop", { offset: "0%", stopColor: "#F472B6" }),
          React.createElement("stop", { offset: "100%", stopColor: "#701A75" })
        ),
        React.createElement("linearGradient", { id: "su-surfaceShine", x1: "0%", y1: "0%", x2: "100%", y2: "100%" },
          React.createElement("stop", { offset: "0%", stopColor: "white", stopOpacity: "0.5" }),
          React.createElement("stop", { offset: "40%", stopColor: "white", stopOpacity: "0.1" }),
          React.createElement("stop", { offset: "100%", stopColor: "white", stopOpacity: "0" })
        )
      ),
      React.createElement("rect", { width: "512", height: "512", rx: "128", fill: "#020617" }),
      React.createElement("g", { transform: "translate(64, 64)", opacity: "0.3" },
        React.createElement("rect", { width: "384", height: "384", rx: "20", stroke: "url(#su-logicCyan)", strokeWidth: "2", fill: "#0F172A", fillOpacity: "0.5" }),
        React.createElement("g", { stroke: "url(#su-logicCyan)", strokeWidth: "1", strokeDasharray: "4 4" },
          React.createElement("line", { x1: "128", y1: "0", x2: "128", y2: "384" }),
          React.createElement("line", { x1: "256", y1: "0", x2: "256", y2: "384" }),
          React.createElement("line", { x1: "0", y1: "128", x2: "384", y2: "128" }),
          React.createElement("line", { x1: "0", y1: "256", x2: "384", y2: "256" })
        ),
        React.createElement("circle", { cx: "128", cy: "128", r: "3", fill: "#22D3EE", filter: "url(#su-ultraGlow)" }),
        React.createElement("circle", { cx: "256", cy: "256", r: "3", fill: "#22D3EE", filter: "url(#su-ultraGlow)" })
      ),
      React.createElement("path", { d: "M64 160 H448", stroke: "#22D3EE", strokeWidth: "1", opacity: "0.2" }),
      React.createElement("path", { d: "M64 352 H448", stroke: "#22D3EE", strokeWidth: "1", opacity: "0.2" }),
      React.createElement("g", { transform: "translate(146, 146)", filter: "url(#su-glassRefraction)" },
        React.createElement("rect", { x: "-15", y: "-15", width: "250", height: "250", rx: "30", fill: "#701A75", opacity: "0.1", filter: "url(#su-ultraGlow)" }),
        React.createElement("rect", { width: "220", height: "220", rx: "24", fill: "#0F172A", stroke: "url(#su-solveMagenta)", strokeWidth: "3" }),
        React.createElement("path", { d: "M10 10 H50 M10 10 V50 M210 170 V210 H170", stroke: "white", strokeWidth: "2", strokeLinecap: "round", opacity: "0.6" }),
        React.createElement("g", { transform: "translate(110, 110)" },
          React.createElement("path", { d: "M-40 -50 H40 L-10 60", stroke: "#F472B6", strokeWidth: "18", strokeLinecap: "round", strokeLinejoin: "round", filter: "url(#su-ultraGlow)", opacity: "0.4" }),
          React.createElement("path", { d: "M-40 -50 H40 L-10 60", stroke: "url(#su-solveMagenta)", strokeWidth: "12", strokeLinecap: "round", strokeLinejoin: "round" }),
          React.createElement("path", { d: "M-40 -50 H40 L-10 60", stroke: "white", strokeWidth: "3", strokeLinecap: "round", strokeLinejoin: "round", opacity: "0.8" })
        ),
        React.createElement("rect", { width: "220", height: "110", rx: "24", fill: "url(#su-surfaceShine)" })
      ),
      React.createElement("g", { fontFamily: "monospace", fontWeight: "bold", fill: "#22D3EE", opacity: "0.4", fontSize: "28" },
        React.createElement("text", { x: "90", y: "110" }, "04"),
        React.createElement("text", { x: "380", y: "110" }, "09"),
        React.createElement("text", { x: "90", y: "420" }, "01"),
        React.createElement("text", { x: "380", y: "420" }, "07")
      ),
      React.createElement("circle", { cx: "256", cy: "40", r: "4", fill: "#F472B6", filter: "url(#su-ultraGlow)" }),
      React.createElement("circle", { cx: "472", cy: "256", r: "3", fill: "#22D3EE", filter: "url(#su-ultraGlow)" }),
      React.createElement("circle", { cx: "40", cy: "256", r: "3", fill: "#22D3EE", filter: "url(#su-ultraGlow)" }),
      React.createElement("rect", { x: "20", y: "20", width: "472", height: "472", rx: "108", stroke: "white", strokeOpacity: "0.05", strokeWidth: "2" })
    );

export const CustomUltraLumenIcon = ({ size = "100%", className = "" }: { size?: number | string, className?: string }) => 
    React.createElement("svg", { width: size, height: size, viewBox: "0 0 512 512", fill: "none", xmlns: "http://www.w3.org/2000/svg", className },
      React.createElement("defs", null,
        React.createElement("filter", { id: "lm-lumenGlow", x: "-200%", y: "-200%", width: "500%", height: "500%" },
          React.createElement("feGaussianBlur", { stdDeviation: "16", result: "blur" }),
          React.createElement("feComposite", { in: "SourceGraphic", in2: "blur", operator: "over" })
        ),
        React.createElement("filter", { id: "lm-glassEffect" },
          React.createElement("feGaussianBlur", { stdDeviation: "2", result: "blur" }),
          React.createElement("feSpecularLighting", { surfaceScale: "5", specularConstant: "1", specularExponent: "40", lightingColor: "#ffffff", in: "blur", result: "spec" },
            React.createElement("fePointLight", { x: "-5000", y: "-10000", z: "20000" })
          ),
          React.createElement("feComposite", { in: "spec", in2: "SourceGraphic", operator: "in", result: "comp" }),
          React.createElement("feComposite", { in: "SourceGraphic", in2: "comp", operator: "over" })
        ),
        React.createElement("linearGradient", { id: "lm-lumenGold", x1: "0%", y1: "0%", x2: "100%", y2: "100%" },
          React.createElement("stop", { offset: "0%", stopColor: "#FDE047" }),
          React.createElement("stop", { offset: "100%", stopColor: "#CA8A04" })
        ),
        React.createElement("linearGradient", { id: "lm-lumenCyan", x1: "0%", y1: "0%", x2: "100%", y2: "100%" },
          React.createElement("stop", { offset: "0%", stopColor: "#22D3EE" }),
          React.createElement("stop", { offset: "100%", stopColor: "#0891B2" })
        ),
        React.createElement("linearGradient", { id: "lm-lumenRose", x1: "0%", y1: "0%", x2: "100%", y2: "100%" },
          React.createElement("stop", { offset: "0%", stopColor: "#F472B6" }),
          React.createElement("stop", { offset: "100%", stopColor: "#9D174D" })
        ),
        React.createElement("linearGradient", { id: "lm-glassShine", x1: "0%", y1: "0%", x2: "100%", y2: "100%" },
          React.createElement("stop", { offset: "0%", stopColor: "white", stopOpacity: "0.4" }),
          React.createElement("stop", { offset: "50%", stopColor: "white", stopOpacity: "0.1" }),
          React.createElement("stop", { offset: "100%", stopColor: "white", stopOpacity: "0" })
        )
      ),
      React.createElement("rect", { width: "512", height: "512", rx: "128", fill: "#020617" }),
      React.createElement("circle", { cx: "256", cy: "256", r: "220", fill: "#1E293B", opacity: "0.15" }),
      React.createElement("g", { opacity: "0.4", filter: "url(#lm-lumenGlow)" },
        React.createElement("path", { d: "M256 160 L160 330 L352 330 Z", stroke: "white", strokeWidth: "2", fill: "none", strokeDasharray: "10 5" }),
        React.createElement("path", { d: "M256 160 L160 330 L352 330 Z", stroke: "white", strokeWidth: "1", fill: "none", opacity: "0.5" })
      ),
      React.createElement("g", { transform: "translate(256, 160)", filter: "url(#lm-glassEffect)" },
        React.createElement("path", { d: "M0 -75 L70 45 H-70 Z", fill: "#FDE047", opacity: "0.1", filter: "url(#lm-lumenGlow)" }),
        React.createElement("path", { d: "M0 -65 L60 38 H-60 Z", fill: "url(#lm-lumenGold)", stroke: "#FDE047", strokeWidth: "2" }),
        React.createElement("path", { d: "M-30 25 L0 -45", stroke: "white", strokeWidth: "4", strokeLinecap: "round", opacity: "0.3" })
      ),
      React.createElement("g", { transform: "translate(160, 330)", filter: "url(#lm-glassEffect)" },
        React.createElement("circle", { r: "75", fill: "#22D3EE", opacity: "0.1", filter: "url(#lm-lumenGlow)" }),
        React.createElement("circle", { r: "65", fill: "url(#lm-lumenCyan)", stroke: "#22D3EE", strokeWidth: "2" }),
        React.createElement("path", { d: "M-35 -35 A 50 50 0 0 1 10 -50", stroke: "white", strokeWidth: "5", strokeLinecap: "round", opacity: "0.4" })
      ),
      React.createElement("g", { transform: "translate(352, 330)", filter: "url(#lm-glassEffect)" },
        React.createElement("rect", { x: "-75", y: "-75", width: "150", height: "150", rx: "15", fill: "#F472B6", opacity: "0.1", filter: "url(#lm-lumenGlow)" }),
        React.createElement("rect", { x: "-65", y: "-65", width: "130", height: "130", rx: "12", fill: "url(#lm-lumenRose)", stroke: "#F472B6", strokeWidth: "2" }),
        React.createElement("path", { d: "M-45 -45 H15 V45", stroke: "white", strokeWidth: "5", strokeLinecap: "round", strokeOpacity: "0.3", fill: "none" })
      ),
      React.createElement("circle", { cx: "256", cy: "256", r: "4", fill: "white", filter: "url(#lm-lumenGlow)" }),
      React.createElement("circle", { cx: "200", cy: "180", r: "2", fill: "#22D3EE", opacity: "0.6" }),
      React.createElement("circle", { cx: "312", cy: "180", r: "2", fill: "#F472B6", opacity: "0.6" }),
      React.createElement("circle", { cx: "256", cy: "400", r: "3", fill: "#FDE047", opacity: "0.4" }),
      React.createElement("rect", { x: "24", y: "24", width: "464", height: "464", rx: "104", stroke: "white", strokeOpacity: "0.05", strokeWidth: "4" })
    );

export const CustomUltraBreakerIcon = ({ size = "100%", className = "" }: { size?: number | string, className?: string }) => 
    React.createElement("svg", { width: size, height: size, viewBox: "0 0 512 512", fill: "none", xmlns: "http://www.w3.org/2000/svg", className },
      React.createElement("defs", null,
        React.createElement("filter", { id: "brk-neonGlow", x: "-200%", y: "-200%", width: "500%", height: "500%" },
          React.createElement("feGaussianBlur", { stdDeviation: "15", result: "blur" }),
          React.createElement("feComposite", { in: "SourceGraphic", in2: "blur", operator: "over" })
        ),
        React.createElement("radialGradient", { id: "brk-liquidMetal", cx: "30%", cy: "30%", r: "80%" },
          React.createElement("stop", { offset: "0%", stopColor: "#FFFFFF" }),
          React.createElement("stop", { offset: "30%", stopColor: "#E2E8F0" }),
          React.createElement("stop", { offset: "70%", stopColor: "#475569" }),
          React.createElement("stop", { offset: "100%", stopColor: "#0F172A" })
        ),
        React.createElement("linearGradient", { id: "brk-crystalOrange", x1: "0%", y1: "0%", x2: "100%", y2: "100%" },
          React.createElement("stop", { offset: "0%", stopColor: "#FB923C" }),
          React.createElement("stop", { offset: "100%", stopColor: "#EA580C" })
        ),
        React.createElement("linearGradient", { id: "brk-crystalCyan", x1: "0%", y1: "0%", x2: "100%", y2: "100%" },
          React.createElement("stop", { offset: "0%", stopColor: "#22D3EE" }),
          React.createElement("stop", { offset: "100%", stopColor: "#0891B2" })
        ),
        React.createElement("linearGradient", { id: "brk-glassShine", x1: "0%", y1: "0%", x2: "0%", y2: "100%" },
          React.createElement("stop", { offset: "0%", stopColor: "white", stopOpacity: "0.5" }),
          React.createElement("stop", { offset: "50%", stopColor: "white", stopOpacity: "0.1" }),
          React.createElement("stop", { offset: "100%", stopColor: "white", stopOpacity: "0" })
        )
      ),
      React.createElement("rect", { width: "512", height: "512", rx: "108", fill: "#020617" }),
      React.createElement("circle", { cx: "256", cy: "256", r: "300", fill: "#1E293B", opacity: "0.2" }),
      React.createElement("g", { opacity: "0.4" },
        React.createElement("rect", { x: "60", y: "60", width: "120", height: "45", rx: "8", fill: "url(#brk-crystalCyan)", stroke: "white", strokeOpacity: "0.2" }),
        React.createElement("rect", { x: "332", y: "60", width: "120", height: "45", rx: "8", fill: "#A855F7", stroke: "white", strokeOpacity: "0.2" }),
        React.createElement("rect", { x: "196", y: "60", width: "120", height: "45", rx: "8", fill: "url(#brk-crystalOrange)", stroke: "white", strokeOpacity: "0.2" })
      ),
      React.createElement("g", { transform: "translate(256, 180)" },
        React.createElement("circle", { r: "80", stroke: "#FB923C", strokeWidth: "2", opacity: "0.3", filter: "url(#brk-neonGlow)" }),
        React.createElement("circle", { r: "40", stroke: "white", strokeWidth: "1", opacity: "0.5" }),
        React.createElement("g", { transform: "translate(-70, -30)" },
          React.createElement("rect", { width: "140", height: "60", rx: "10", fill: "url(#brk-crystalOrange)", filter: "url(#brk-neonGlow)", opacity: "0.8" }),
          React.createElement("rect", { width: "140", height: "60", rx: "10", fill: "url(#brk-crystalOrange)", stroke: "white", strokeWidth: "2" }),
          React.createElement("rect", { x: "5", y: "5", width: "130", height: "25", rx: "5", fill: "url(#brk-glassShine)" }),
          React.createElement("path", { d: "M70 30L90 10M70 30L50 50M70 30L110 40", stroke: "white", strokeWidth: "2", strokeLinecap: "round", opacity: "0.8" })
        ),
        React.createElement("g", { transform: "translate(0, 45)" },
          React.createElement("circle", { r: "35", fill: "#FB923C", opacity: "0.2", filter: "url(#brk-neonGlow)" }),
          React.createElement("circle", { r: "28", fill: "url(#brk-liquidMetal)", stroke: "white", strokeWidth: "1" }),
          React.createElement("circle", { cx: "-10", cy: "-10", r: "6", fill: "white", opacity: "0.8", filter: "url(#brk-neonGlow)" })
        )
      ),
      React.createElement("path", { d: "M256 420C256 380 256 320 256 250", stroke: "white", strokeWidth: "2", strokeDasharray: "20 10", opacity: "0.2" }),
      React.createElement("path", { d: "M256 420L256 260", stroke: "url(#brk-crystalCyan)", strokeWidth: "40", strokeLinecap: "round", opacity: "0.1", filter: "url(#brk-neonGlow)" }),
      React.createElement("g", { transform: "translate(116, 420)" },
        React.createElement("rect", { width: "280", height: "30", rx: "15", fill: "#22D3EE", opacity: "0.15", filter: "url(#brk-neonGlow)" }),
        React.createElement("path", { d: "M0 15C0 6.7, 6.7 0, 15 0H265C273.3 0, 280 6.7, 280 15V15C280 23.3, 273.3 30, 265 30H15C6.7 30, 0 23.3, 0 15V15Z", fill: "#0F172A", stroke: "#22D3EE", strokeWidth: "4" }),
        React.createElement("rect", { x: "110", y: "10", width: "60", height: "10", rx: "5", fill: "#22D3EE", filter: "url(#brk-neonGlow)" }),
        React.createElement("circle", { cx: "20", cy: "15", r: "4", fill: "#22D3EE" }),
        React.createElement("circle", { cx: "260", cy: "15", r: "4", fill: "#22D3EE" }),
        React.createElement("path", { d: "M10 8H270", stroke: "white", strokeWidth: "2", strokeLinecap: "round", opacity: "0.2" })
      ),
      React.createElement("rect", { x: "360", y: "200", width: "8", height: "8", rx: "2", fill: "#FB923C", transform: "rotate(45 360 200)", filter: "url(#brk-neonGlow)" }),
      React.createElement("rect", { x: "160", y: "180", width: "6", height: "6", rx: "1.5", fill: "#FB923C", transform: "rotate(20 160 180)" }),
      React.createElement("circle", { cx: "256", cy: "120", r: "3", fill: "white", opacity: "0.5" })
    );

export const CustomUltraInvadersIcon = ({ size = "100%", className = "" }: { size?: number | string, className?: string }) =>
    React.createElement("svg", { width: size, height: size, viewBox: "0 0 512 512", fill: "none", xmlns: "http://www.w3.org/2000/svg", className },
      React.createElement("defs", null,
        React.createElement("filter", { id: "iv-neonGlow", x: "-200%", y: "-200%", width: "500%", height: "500%" },
          React.createElement("feGaussianBlur", { stdDeviation: "10", result: "blur" }),
          React.createElement("feComposite", { in: "SourceGraphic", in2: "blur", operator: "over" })
        ),
        React.createElement("linearGradient", { id: "iv-shipGrad", x1: "0%", y1: "0%", x2: "0%", y2: "100%" },
          React.createElement("stop", { offset: "0%", stopColor: "#22D3EE" }),
          React.createElement("stop", { offset: "100%", stopColor: "#0891B2" })
        ),
        React.createElement("linearGradient", { id: "iv-alienGrad", x1: "0%", y1: "0%", x2: "0%", y2: "100%" },
          React.createElement("stop", { offset: "0%", stopColor: "#F472B6" }),
          React.createElement("stop", { offset: "100%", stopColor: "#9D174D" })
        ),
        React.createElement("linearGradient", { id: "iv-shieldGrad", x1: "0%", y1: "0%", x2: "100%", y2: "100%" },
          React.createElement("stop", { offset: "0%", stopColor: "#38BDF8", stopOpacity: "0.3" }),
          React.createElement("stop", { offset: "100%", stopColor: "#0EA5E9", stopOpacity: "0.1" })
        )
      ),
      React.createElement("rect", { width: "512", height: "512", rx: "108", fill: "#020617" }),
      React.createElement("circle", { cx: "100", cy: "100", r: "1.5", fill: "white", opacity: "0.4" }),
      React.createElement("circle", { cx: "400", cy: "150", r: "1", fill: "white", opacity: "0.3" }),
      React.createElement("circle", { cx: "450", cy: "400", r: "2", fill: "white", opacity: "0.2" }),
      React.createElement("circle", { cx: "80", cy: "350", r: "1.2", fill: "white", opacity: "0.3" }),
      React.createElement("g", { transform: "translate(136, 80)" },
        React.createElement("path", { d: "M60 20H180V40H200V100H180V120H160V100H80V120H60V100H40V40H60V20Z", fill: "#F472B6", opacity: "0.15", filter: "url(#iv-neonGlow)" }),
        React.createElement("path", { fillRule: "evenodd", clipRule: "evenodd", d: "M80 0H160V20H200V40H240V100H200V120H180V100H60V120H40V100H0V40H40V20H80V0ZM60 40H100V60H60V40ZM140 40H180V60H140V40ZM80 80H160V100H80V80Z", fill: "url(#iv-alienGrad)", filter: "url(#iv-neonGlow)" }),
        React.createElement("rect", { x: "65", y: "45", width: "30", height: "10", fill: "#FCE7F3", opacity: "0.8" }),
        React.createElement("rect", { x: "145", y: "45", width: "30", height: "10", fill: "#FCE7F3", opacity: "0.8" })
      ),
      React.createElement("g", { filter: "url(#iv-neonGlow)" },
        React.createElement("rect", { x: "251", y: "210", width: "10", height: "180", rx: "5", fill: "#4ADE80" }),
        React.createElement("rect", { x: "254", y: "210", width: "4", height: "180", rx: "2", fill: "white" })
      ),
      React.createElement("g", { transform: "translate(60, 320)" },
        React.createElement("rect", { x: "0", y: "0", width: "80", height: "40", rx: "4", fill: "url(#iv-shieldGrad)", stroke: "#38BDF8", strokeWidth: "2" }),
        React.createElement("path", { d: "M10 10L30 30M50 5L70 25", stroke: "#38BDF8", strokeWidth: "1", opacity: "0.5" }),
        React.createElement("rect", { x: "312", y: "0", width: "80", height: "40", rx: "4", fill: "url(#iv-shieldGrad)", stroke: "#38BDF8", strokeWidth: "2" }),
        React.createElement("path", { d: "M322 25L342 5M362 35L382 15", stroke: "#38BDF8", strokeWidth: "1", opacity: "0.5" })
      ),
      React.createElement("g", { transform: "translate(206, 400)" },
        React.createElement("path", { d: "M50 0L100 80H0L50 0Z", fill: "#22D3EE", opacity: "0.2", filter: "url(#iv-neonGlow)" }),
        React.createElement("path", { d: "M50 10L65 40H35L50 10Z", fill: "#0891B2" }),
        React.createElement("rect", { x: "10", y: "40", width: "80", height: "30", rx: "4", fill: "url(#iv-shipGrad)", filter: "url(#iv-neonGlow)" }),
        React.createElement("rect", { x: "40", y: "30", width: "20", height: "20", rx: "2", fill: "url(#iv-shipGrad)" }),
        React.createElement("rect", { x: "46", y: "15", width: "8", height: "20", rx: "2", fill: "white", filter: "url(#iv-neonGlow)" }),
        React.createElement("path", { d: "M20 45H80", stroke: "white", strokeWidth: "2", strokeLinecap: "round", opacity: "0.3" })
      )
    );

export const CustomUltraPacmanIcon = ({ size = "100%", className = "" }: { size?: number | string, className?: string }) => 
    React.createElement("svg", { width: size, height: size, viewBox: "0 0 512 512", fill: "none", xmlns: "http://www.w3.org/2000/svg", className },
      React.createElement("defs", null,
        React.createElement("filter", { id: "pm-neonGlow", x: "-200%", y: "-200%", width: "500%", height: "500%" },
          React.createElement("feGaussianBlur", { stdDeviation: "12", result: "blur" }),
          React.createElement("feComposite", { in: "SourceGraphic", in2: "blur", operator: "over" })
        ),
        React.createElement("radialGradient", { id: "pm-pacmanGrad", cx: "40%", cy: "40%", r: "60%" },
          React.createElement("stop", { offset: "0%", stopColor: "#FDE047" }),
          React.createElement("stop", { offset: "100%", stopColor: "#CA8A04" })
        ),
        React.createElement("linearGradient", { id: "pm-ghostGrad", x1: "0%", y1: "0%", x2: "100%", y2: "100%" },
          React.createElement("stop", { offset: "0%", stopColor: "#EF4444" }),
          React.createElement("stop", { offset: "100%", stopColor: "#7F1D1D" })
        ),
        React.createElement("linearGradient", { id: "pm-glassReflect", x1: "0%", y1: "0%", x2: "100%", y2: "100%" },
          React.createElement("stop", { offset: "0%", stopColor: "white", stopOpacity: "0.3" }),
          React.createElement("stop", { offset: "50%", stopColor: "white", stopOpacity: "0.05" }),
          React.createElement("stop", { offset: "100%", stopColor: "white", stopOpacity: "0" })
        )
      ),
      React.createElement("rect", { width: "512", height: "512", rx: "108", fill: "#020617" }),
      React.createElement("g", { stroke: "#1D4ED8", strokeWidth: "8", strokeLinecap: "round", opacity: "0.4", filter: "url(#pm-neonGlow)" },
        React.createElement("path", { d: "M80 80H200M80 80V200M432 80H312M432 80V200M80 432H200M80 432V312M432 432H312M432 432V312" }),
        React.createElement("rect", { x: "236", y: "40", width: "40", height: "80", rx: "4" })
      ),
      React.createElement("g", { transform: "translate(320, 240) rotate(15)" },
        React.createElement("path", { d: "M-50 40V-10C-50 -37.6 -27.6 -60 0 -60C27.6 -60 50 -37.6 50 -10V40L33 30L17 40L0 30L-17 40L-33 30L-50 40Z", fill: "url(#pm-ghostGrad)", filter: "url(#pm-neonGlow)", opacity: "0.6" }),
        React.createElement("path", { d: "M-50 40V-10C-50 -37.6 -27.6 -60 0 -60C27.6 -60 50 -37.6 50 -10V40L33 30L17 40L0 30L-17 40L-33 30L-50 40Z", fill: "#020617", stroke: "#EF4444", strokeWidth: "3" }),
        React.createElement("circle", { cx: "-18", cy: "-15", r: "12", fill: "white" }),
        React.createElement("circle", { cx: "18", cy: "-15", r: "12", fill: "white" }),
        React.createElement("circle", { cx: "-12", cy: "-15", r: "5", fill: "#1D4ED8" }),
        React.createElement("circle", { cx: "24", cy: "-15", r: "5", fill: "#1D4ED8" })
      ),
      React.createElement("g", { transform: "translate(180, 280)" },
        React.createElement("path", { d: "M0 0L85 -50A100 100 0 1 0 85 50Z", fill: "#FDE047", opacity: "0.2", filter: "url(#pm-neonGlow)" }),
        React.createElement("path", { d: "M0 0L85 -50A100 100 0 1 0 85 50Z", fill: "url(#pm-pacmanGrad)", stroke: "#CA8A04", strokeWidth: "2" }),
        React.createElement("circle", { cx: "20", cy: "-45", r: "10", fill: "#020617" }),
        React.createElement("path", { d: "M-60 -20A70 70 0 0 1 20 -70", stroke: "white", strokeWidth: "6", strokeLinecap: "round", opacity: "0.3" })
      ),
      React.createElement("g", { transform: "translate(380, 150)" },
        React.createElement("circle", { r: "20", fill: "white", filter: "url(#pm-neonGlow)" }),
        React.createElement("circle", { r: "12", fill: "white" }),
        React.createElement("circle", { cx: "-30", cy: "-10", r: "3", fill: "white", opacity: "0.5" }),
        React.createElement("circle", { cx: "10", cy: "-35", r: "2", fill: "white", opacity: "0.3" })
      ),
      React.createElement("circle", { cx: "280", cy: "220", r: "6", fill: "#FDE047", opacity: "0.6" })
    );

export const CustomCheckersIcon = ({ size = "100%", className = "" }: { size?: number | string, className?: string }) =>
    React.createElement("svg", { width: size, height: size, viewBox: "0 0 512 512", fill: "none", xmlns: "http://www.w3.org/2000/svg", className },
      React.createElement("defs", null,
        React.createElement("filter", { id: "glow-soft", x: "-20%", y: "-20%", width: "140%", height: "140%" },
          React.createElement("feGaussianBlur", { stdDeviation: "5", result: "blur" }),
          React.createElement("feComposite", { in: "SourceGraphic", in2: "blur", operator: "over" })
        ),
        React.createElement("filter", { id: "glow-strong", x: "-50%", y: "-50%", width: "200%", height: "200%" },
          React.createElement("feGaussianBlur", { stdDeviation: "15", result: "blur" }),
          React.createElement("feFlood", { floodColor: "#00f2ff", floodOpacity: "0.5", result: "color" }),
          React.createElement("feComposite", { in: "color", in2: "blur", operator: "in", result: "coloredBlur" }),
          React.createElement("feMerge", null,
            React.createElement("feMergeNode", { in: "coloredBlur" }),
            React.createElement("feMergeNode", { in: "SourceGraphic" })
          )
        ),
        React.createElement("filter", { id: "glow-magenta", x: "-50%", y: "-50%", width: "200%", height: "200%" },
          React.createElement("feGaussianBlur", { stdDeviation: "12", result: "blur" }),
          React.createElement("feFlood", { floodColor: "#ff0077", floodOpacity: "0.6", result: "color" }),
          React.createElement("feComposite", { in: "color", in2: "blur", operator: "in", result: "coloredBlur" }),
          React.createElement("feMerge", null,
            React.createElement("feMergeNode", { in: "coloredBlur" }),
            React.createElement("feMergeNode", { in: "SourceGraphic" })
          )
        ),
        React.createElement("radialGradient", { id: "pawnInternal", cx: "50%", cy: "50%", r: "50%" },
          React.createElement("stop", { offset: "0%", stopColor: "#1a0a25" }),
          React.createElement("stop", { offset: "100%", stopColor: "#050510" })
        )
      ),
      React.createElement("rect", { width: "512", height: "512", rx: "100", fill: "#020205" }),
      React.createElement("circle", { cx: "256", cy: "256", r: "160", stroke: "#00f2ff", strokeWidth: "12", filter: "url(#glow-strong)" }),
      React.createElement("circle", { cx: "256", cy: "256", r: "160", stroke: "#fff", strokeWidth: "1", opacity: "0.3" }),
      React.createElement("circle", { cx: "256", cy: "256", r: "105", fill: "url(#pawnInternal)" }),
      React.createElement("circle", { cx: "256", cy: "256", r: "100", stroke: "#ff0077", strokeWidth: "8", filter: "url(#glow-magenta)" }),
      React.createElement("path", { d: "M200 295L200 235L230 260L256 210L282 260L312 235L312 295H200Z", fill: "#ff0077", filter: "url(#glow-magenta)" }),
      React.createElement("path", { d: "M256 210L262 225H250L256 210Z", fill: "white", opacity: "0.6" })
    );

export const CustomUltraSkyjoIcon = ({ size = "100%", className = "" }: { size?: number | string, className?: string }) => 
    React.createElement("svg", { width: size, height: size, viewBox: "0 0 512 512", fill: "none", xmlns: "http://www.w3.org/2000/svg", className },
      React.createElement("defs", null,
        React.createElement("filter", { id: "sk-hyperGlow", x: "-200%", y: "-200%", width: "500%", height: "500%" },
          React.createElement("feGaussianBlur", { stdDeviation: "15", result: "blur" }),
          React.createElement("feComposite", { in: "SourceGraphic", in2: "blur", operator: "over" })
        ),
        React.createElement("filter", { id: "sk-cardBevel" },
          React.createElement("feGaussianBlur", { stdDeviation: "2", result: "blur" }),
          React.createElement("feSpecularLighting", { surfaceScale: "5", specularConstant: "0.8", specularExponent: "30", lightingColor: "#ffffff", in: "blur", result: "spec" },
            React.createElement("fePointLight", { x: "-5000", y: "-10000", z: "20000" })
          ),
          React.createElement("feComposite", { in: "spec", in2: "SourceGraphic", operator: "in", result: "comp" }),
          React.createElement("feComposite", { in: "SourceGraphic", in2: "comp", operator: "over" })
        ),
        React.createElement("linearGradient", { id: "sk-greenMaster", x1: "0%", y1: "0%", x2: "100%", y2: "100%" },
          React.createElement("stop", { offset: "0%", stopColor: "#4ADE80" }),
          React.createElement("stop", { offset: "100%", stopColor: "#064E3B" })
        ),
        React.createElement("linearGradient", { id: "sk-redMaster", x1: "0%", y1: "0%", x2: "100%", y2: "100%" },
          React.createElement("stop", { offset: "0%", stopColor: "#F87171" }),
          React.createElement("stop", { offset: "100%", stopColor: "#7F1D1D" })
        ),
        React.createElement("linearGradient", { id: "sk-premiumReflect", x1: "0%", y1: "0%", x2: "100%", y2: "100%" },
          React.createElement("stop", { offset: "0%", stopColor: "white", stopOpacity: "0.3" }),
          React.createElement("stop", { offset: "45%", stopColor: "white", stopOpacity: "0.05" }),
          React.createElement("stop", { offset: "100%", stopColor: "white", stopOpacity: "0" })
        )
      ),
      React.createElement("rect", { width: "512", height: "512", rx: "108", fill: "#020617" }),
      React.createElement("circle", { cx: "256", cy: "256", r: "250", fill: "#1E293B", opacity: "0.15" }),
      React.createElement("g", { transform: "translate(100, 220) rotate(-20)" },
        React.createElement("rect", { width: "180", height: "260", rx: "20", fill: "#0F172A", stroke: "#991B1B", strokeWidth: "2", opacity: "0.5" }),
        React.createElement("text", { x: "90", y: "160", fontFamily: "Arial Black", fontSize: "80", fill: "#991B1B", textAnchor: "middle", opacity: "0.4" }, "12")
      ),
      React.createElement("g", { transform: "translate(160, 160) rotate(-5)" },
        React.createElement("rect", { width: "190", height: "270", rx: "22", fill: "#0F172A", stroke: "#F59E0B", strokeWidth: "3", filter: "url(#sk-hyperGlow)", opacity: "0.3" }),
        React.createElement("rect", { width: "190", height: "270", rx: "22", fill: "#0F172A", stroke: "#F59E0B", strokeWidth: "2" }),
        React.createElement("text", { x: "95", y: "165", fontFamily: "Arial Black", fontSize: "90", fill: "#F59E0B", textAnchor: "middle" }, "5"),
        React.createElement("rect", { width: "190", height: "270", rx: "22", fill: "url(#sk-premiumReflect)" })
      ),
      React.createElement("g", { transform: "translate(240, 100) rotate(12)", filter: "url(#sk-cardBevel)" },
        React.createElement("rect", { width: "210", height: "290", rx: "24", stroke: "#4ADE80", strokeWidth: "15", filter: "url(#sk-hyperGlow)", opacity: "0.4" }),
        React.createElement("rect", { width: "210", height: "290", rx: "24", fill: "#020617", stroke: "#4ADE80", strokeWidth: "4" }),
        React.createElement("path", { d: "M40 25 H20 V45 M170 25 H190 V45 M40 265 H20 V245 M170 265 H190 V245", stroke: "#4ADE80", strokeWidth: "3", opacity: "0.7" }),
        React.createElement("text", { x: "105", y: "180", fontFamily: "Arial Black", fontSize: "120", fill: "#4ADE80", textAnchor: "middle", filter: "url(#sk-hyperGlow)" }, "-2"),
        React.createElement("circle", { cx: "105", cy: "240", r: "6", fill: "#4ADE80", filter: "url(#sk-hyperGlow)" }),
        React.createElement("rect", { width: "210", height: "290", rx: "24", fill: "url(#sk-premiumReflect)" })
      ),
      React.createElement("g", { filter: "url(#sk-hyperGlow)" },
        React.createElement("circle", { cx: "420", cy: "150", r: "4", fill: "#4ADE80" }),
        React.createElement("circle", { cx: "450", cy: "300", r: "2", fill: "#F59E0B" }),
        React.createElement("circle", { cx: "80", cy: "150", r: "3", fill: "#F87171" }),
        React.createElement("rect", { x: "440", y: "120", width: "8", height: "2", rx: "1", fill: "#4ADE80", transform: "rotate(45 440 120)" })
      )
    );

export const CustomBattleshipIcon = ({ size = "100%", className = "" }: { size?: number | string, className?: string }) => 
    React.createElement("svg", { width: size, height: size, viewBox: "0 0 512 512", fill: "none", xmlns: "http://www.w3.org/2000/svg", className },
      React.createElement("defs", null,
        React.createElement("filter", { id: "bs-neonGlow", x: "-200%", y: "-200%", width: "500%", height: "500%" },
          React.createElement("feGaussianBlur", { stdDeviation: "12", result: "blur" }),
          React.createElement("feComposite", { in: "SourceGraphic", in2: "blur", operator: "over" })
        ),
        React.createElement("linearGradient", { id: "bs-shipGradient", x1: "256", y1: "150", x2: "256", y2: "400", gradientUnits: "userSpaceOnUse" },
          React.createElement("stop", { offset: "0%", stopColor: "#22D3EE" }),
          React.createElement("stop", { offset: "100%", stopColor: "#0891B2" })
        ),
        React.createElement("radialGradient", { id: "bs-radarSweep", cx: "256", cy: "256", r: "240", gradientUnits: "userSpaceOnUse" },
          React.createElement("stop", { offset: "0%", stopColor: "#22D3EE", stopOpacity: "0.3" }),
          React.createElement("stop", { offset: "100%", stopColor: "#22D3EE", stopOpacity: "0" })
        )
      ),
      React.createElement("rect", { width: "512", height: "512", rx: "108", fill: "#020617" }),
      React.createElement("g", { stroke: "#1E293B", strokeWidth: "1.5" },
        React.createElement("circle", { cx: "256", cy: "256", r: "240", strokeDasharray: "10 10" }),
        React.createElement("circle", { cx: "256", cy: "256", r: "160" }),
        React.createElement("circle", { cx: "256", cy: "256", r: "80" }),
        React.createElement("line", { x1: "16", y1: "256", x2: "496", y2: "256", opacity: "0.5" }),
        React.createElement("line", { x1: "256", y1: "16", x2: "256", y2: "496", opacity: "0.5" })
      ),
      React.createElement("path", { d: "M256 256 L460 110 A 240 240 0 0 0 256 16 Z", fill: "url(#bs-radarSweep)", filter: "url(#bs-neonGlow)", opacity: "0.3" }),
      React.createElement("g", { id: "bs-warship-top-view", transform: "translate(256, 256)" },
        React.createElement("path", { d: "M0 -120 L35 -60 V80 L0 110 L-35 80 V-60 L0 -120Z", stroke: "#22D3EE", strokeWidth: "15", filter: "url(#bs-neonGlow)", opacity: "0.2" }),
        React.createElement("path", { d: "M0 -120 L35 -60 V80 L0 110 L-35 80 V-60 L0 -120Z", fill: "#020617", stroke: "url(#bs-shipGradient)", strokeWidth: "4" }),
        React.createElement("path", { d: "M-20 -40 H20 M-25 0 H25 M-20 40 H20", stroke: "#22D3EE", strokeWidth: "2", opacity: "0.5" }),
        React.createElement("rect", { x: "-10", y: "-80", width: "20", height: "40", rx: "2", fill: "url(#bs-shipGradient)" }),
        React.createElement("g", { fill: "#22D3EE" },
          React.createElement("circle", { cx: "0", cy: "-70", r: "4" }),
          React.createElement("circle", { cx: "0", cy: "50", r: "6" }),
          React.createElement("rect", { x: "-12", y: "-72", width: "24", height: "2", rx: "1" }),
          React.createElement("rect", { x: "-15", y: "48", width: "30", height: "3", rx: "1" })
        )
      ),
      React.createElement("g", { id: "bs-targeting", transform: "translate(380, 150)" },
        React.createElement("circle", { cx: "0", cy: "0", r: "40", stroke: "#F43F5E", strokeWidth: "2", strokeDasharray: "10 8", filter: "url(#bs-neonGlow)" }),
        React.createElement("path", { d: "M-50 0 H-30 M30 0 H50 M0 -50 V-30 M0 30 V50", stroke: "#F43F5E", strokeWidth: "3", strokeLinecap: "round" }),
        React.createElement("circle", { cx: "0", cy: "0", r: "3", fill: "#F43F5E", filter: "url(#bs-neonGlow)" })
      ),
      React.createElement("g", { transform: "translate(150, 150)" },
        React.createElement("circle", { cx: "0", cy: "0", r: "15", stroke: "#22D3EE", strokeWidth: "2", opacity: "0.5", filter: "url(#bs-neonGlow)" }),
        React.createElement("circle", { cx: "0", cy: "0", r: "5", fill: "#22D3EE" })
      ),
      React.createElement("path", { d: "M80 80 Q 30 130 80 230", stroke: "white", strokeWidth: "1.5", strokeLinecap: "round", opacity: "0.1" })
    );

export const CustomUltraTetrisIcon = ({ size = "100%", className = "" }: { size?: number | string, className?: string }) => 
    React.createElement("svg", { width: size, height: size, viewBox: "0 0 512 512", fill: "none", xmlns: "http://www.w3.org/2000/svg", className },
      React.createElement("defs", null,
        React.createElement("filter", { id: "ut-neonGlow", x: "-200%", y: "-200%", width: "500%", height: "500%" },
          React.createElement("feGaussianBlur", { stdDeviation: "15", result: "blur" }),
          React.createElement("feComposite", { in: "SourceGraphic", in2: "blur", operator: "over" })
        ),
        React.createElement("filter", { id: "ut-bevel" },
          React.createElement("feGaussianBlur", { stdDeviation: "2", result: "blur" }),
          React.createElement("feSpecularLighting", { surfaceScale: "5", specularConstant: "0.8", specularExponent: "20", lightingColor: "#ffffff", in: "blur", result: "specular" },
            React.createElement("fePointLight", { x: "-5000", y: "-10000", z: "20000" })
          ),
          React.createElement("feComposite", { in: "specular", in2: "SourceGraphic", operator: "in", result: "composite" }),
          React.createElement("feComposite", { in: "SourceGraphic", in2: "composite", operator: "over" })
        ),
        React.createElement("linearGradient", { id: "ut-gradPurple", x1: "0%", y1: "0%", x2: "100%", y2: "100%" },
          React.createElement("stop", { offset: "0%", stopColor: "#D946EF" }), React.createElement("stop", { offset: "100%", stopColor: "#701A75" })
        ),
        React.createElement("linearGradient", { id: "ut-gradCyan", x1: "0%", y1: "0%", x2: "100%", y2: "100%" },
          React.createElement("stop", { offset: "0%", stopColor: "#22D3EE" }), React.createElement("stop", { offset: "100%", stopColor: "#0891B2" })
        ),
        React.createElement("linearGradient", { id: "ut-gradOrange", x1: "0%", y1: "0%", x2: "100%", y2: "100%" },
          React.createElement("stop", { offset: "0%", stopColor: "#FB923C" }), React.createElement("stop", { offset: "100%", stopColor: "#9A3412" })
        )
      ),
      React.createElement("rect", { width: "512", height: "512", rx: "108", fill: "#0F172A" }),
      React.createElement("g", { opacity: "0.1" },
        React.createElement("path", { d: "M0 64h512M0 128h512M0 192h512M0 256h512M0 320h512M0 384h512M0 448h512M64 0v512M128 0v512M192 0v512M256 0v512M320 0v512M384 0v512M448 0v512", stroke: "white", strokeWidth: "1" })
      ),
      React.createElement("g", { id: "ut-pieceT", transform: "translate(160, 128)", filter: "url(#ut-bevel)" },
        React.createElement("path", { d: "M64 0h64v64h64v64H0V64h64V0z", fill: "none", stroke: "#D946EF", strokeWidth: "12", filter: "url(#ut-neonGlow)", opacity: "0.4" }),
        React.createElement("rect", { x: "64", y: "0", width: "62", height: "62", rx: "4", fill: "url(#ut-gradPurple)", stroke: "#701A75", strokeWidth: "2" }),
        React.createElement("rect", { x: "0", y: "64", width: "62", height: "62", rx: "4", fill: "url(#ut-gradPurple)", stroke: "#701A75", strokeWidth: "2" }),
        React.createElement("rect", { x: "64", y: "64", width: "62", height: "62", rx: "4", fill: "url(#ut-gradPurple)", stroke: "#701A75", strokeWidth: "2" }),
        React.createElement("rect", { x: "128", y: "64", width: "62", height: "62", rx: "4", fill: "url(#ut-gradPurple)", stroke: "#701A75", strokeWidth: "2" })
      ),
      React.createElement("g", { id: "ut-pieceI", transform: "translate(384, 192)", filter: "url(#ut-bevel)" },
        React.createElement("path", { d: "M0 0v256", stroke: "#22D3EE", strokeWidth: "12", filter: "url(#ut-neonGlow)", opacity: "0.4" }),
        React.createElement("rect", { x: "0", y: "0", width: "62", height: "62", rx: "4", fill: "url(#ut-gradCyan)", stroke: "#0891B2", strokeWidth: "2" }),
        React.createElement("rect", { x: "0", y: "64", width: "62", height: "62", rx: "4", fill: "url(#ut-gradCyan)", stroke: "#0891B2", strokeWidth: "2" }),
        React.createElement("rect", { x: "0", y: "128", width: "62", height: "62", rx: "4", fill: "url(#ut-gradCyan)", stroke: "#0891B2", strokeWidth: "2" }),
        React.createElement("rect", { x: "0", y: "192", width: "62", height: "62", rx: "4", fill: "url(#ut-gradCyan)", stroke: "#0891B2", strokeWidth: "2" })
      ),
      React.createElement("g", { id: "ut-pieceL", transform: "translate(64, 256)", filter: "url(#ut-bevel)" },
        React.createElement("path", { d: "M0 0v192h128v-64H64V0H0z", fill: "none", stroke: "#FB923C", strokeWidth: "12", filter: "url(#ut-neonGlow)", opacity: "0.4" }),
        React.createElement("rect", { x: "0", y: "0", width: "62", height: "62", rx: "4", fill: "url(#ut-gradOrange)", stroke: "#9A3412", strokeWidth: "2" }),
        React.createElement("rect", { x: "0", y: "64", width: "62", height: "62", rx: "4", fill: "url(#ut-gradOrange)", stroke: "#9A3412", strokeWidth: "2" }),
        React.createElement("rect", { x: "0", y: "128", width: "62", height: "62", rx: "4", fill: "url(#ut-gradOrange)", stroke: "#9A3412", strokeWidth: "2" }),
        React.createElement("rect", { x: "64", y: "128", width: "62", height: "62", rx: "4", fill: "url(#ut-gradOrange)", stroke: "#9A3412", strokeWidth: "2" })
      ),
      React.createElement("rect", { x: "64", y: "448", width: "384", height: "8", rx: "4", fill: "white", filter: "url(#ut-neonGlow)", opacity: "0.7" })
    );

export const CustomUltraSnakeIcon = ({ size = "100%", className = "" }: { size?: number | string, className?: string }) => 
    React.createElement("svg", { width: size, height: size, viewBox: "0 0 512 512", fill: "none", xmlns: "http://www.w3.org/2000/svg", className },
      React.createElement("defs", null,
        React.createElement("filter", { id: "us-neonGlow", x: "-200%", y: "-200%", width: "500%", height: "500%" },
          React.createElement("feGaussianBlur", { stdDeviation: "15", result: "blur" }),
          React.createElement("feComposite", { in: "SourceGraphic", in2: "blur", operator: "over" })
        ),
        React.createElement("linearGradient", { id: "us-snakeBodyGrad", x1: "0%", y1: "0%", x2: "100%", y2: "100%" },
          React.createElement("stop", { offset: "0%", stopColor: "#4ADE80" }),
          React.createElement("stop", { offset: "50%", stopColor: "#22C55E" }),
          React.createElement("stop", { offset: "100%", stopColor: "#166534" })
        ),
        React.createElement("radialGradient", { id: "us-appleGrad", cx: "40%", cy: "40%", r: "60%" },
          React.createElement("stop", { offset: "0%", stopColor: "#FF5F7E" }),
          React.createElement("stop", { offset: "100%", stopColor: "#991B1B" })
        )
      ),
      React.createElement("rect", { width: "512", height: "512", rx: "108", fill: "#0F172A" }),
      React.createElement("circle", { cx: "256", cy: "256", r: "300", fill: "#22C55E", opacity: "0.03" }),
      React.createElement("g", { opacity: "0.2" },
        React.createElement("path", { d: "M64 0V512M128 0V512M192 0V512M256 0V512M320 0V512M384 0V512M448 0V512", stroke: "#334155", strokeWidth: "1" }),
        React.createElement("path", { d: "M0 64H512M0 128H512M0 192H512M0 256H512M0 320H512M0 384H512M0 448H512", stroke: "#334155", strokeWidth: "1" })
      ),
      React.createElement("g", { filter: "url(#us-neonGlow)" },
        React.createElement("circle", { cx: "384", cy: "128", r: "24", fill: "url(#us-appleGrad)" }),
        React.createElement("circle", { cx: "378", cy: "120", r: "6", fill: "white", opacity: "0.4" }),
        React.createElement("path", { d: "M384 104C384 98 392 94 396 94", stroke: "#4ADE80", strokeWidth: "4", strokeLinecap: "round" })
      ),
      React.createElement("g", { id: "us-snake-ultra" },
        React.createElement("path", { d: "M128 448V320H320V128", stroke: "#22C55E", strokeWidth: "52", strokeLinejoin: "round", strokeLinecap: "round", filter: "url(#us-neonGlow)", opacity: "0.6" }),
        React.createElement("path", { d: "M128 448V320H320V128", stroke: "url(#us-snakeBodyGrad)", strokeWidth: "48", strokeLinejoin: "round", strokeLinecap: "round" }),
        React.createElement("path", { d: "M128 448V320H320V128", stroke: "white", strokeWidth: "12", strokeLinejoin: "round", strokeLinecap: "round", opacity: "0.2", transform: "translate(-8, -4)" }),
        React.createElement("g", { filter: "url(#us-neonGlow)" },
          React.createElement("rect", { x: "296", y: "80", width: "48", height: "70", rx: "14", fill: "url(#us-snakeBodyGrad)" }),
          React.createElement("rect", { x: "306", y: "96", width: "10", height: "14", rx: "2", fill: "#0F172A" }),
          React.createElement("rect", { x: "326", y: "96", width: "10", height: "14", rx: "2", fill: "#0F172A" }),
          React.createElement("circle", { cx: "308", cy: "99", r: "2", fill: "white", opacity: "0.8" }),
          React.createElement("circle", { cx: "328", cy: "99", r: "2", fill: "white", opacity: "0.8" })
        ),
        React.createElement("path", { d: "M320 80V60M315 55L320 60L325 55", stroke: "#F43F5E", strokeWidth: "4", strokeLinecap: "round", strokeLinejoin: "round", filter: "url(#us-neonGlow)" })
      ),
      React.createElement("circle", { cx: "150", cy: "150", r: "3", fill: "#4ADE80", filter: "url(#us-neonGlow)", opacity: "0.4" }),
      React.createElement("circle", { cx: "400", cy: "400", r: "2", fill: "#FB7185", filter: "url(#us-neonGlow)", opacity: "0.3" }),
      React.createElement("circle", { cx: "256", cy: "384", r: "1.5", fill: "white", opacity: "0.5" })
    );

export const CustomCyberSerpentIcon = ({ size = "100%", className = "" }: { size?: number | string, className?: string }) => 
    React.createElement("svg", { width: size, height: size, viewBox: "0 0 512 512", fill: "none", xmlns: "http://www.w3.org/2000/svg", className },
      React.createElement("defs", null,
        React.createElement("filter", { id: "cs-neonGlow", x: "-200%", y: "-200%", width: "500%", height: "500%" },
          React.createElement("feGaussianBlur", { stdDeviation: "12", result: "blur" }),
          React.createElement("feComposite", { in: "SourceGraphic", in2: "blur", operator: "over" })
        ),
        React.createElement("linearGradient", { id: "cs-neonBody", x1: "0%", y1: "0%", x2: "100%", y2: "100%" },
          React.createElement("stop", { offset: "0%", stopColor: "#22D3EE" }),
          React.createElement("stop", { offset: "100%", stopColor: "#4ADE80" })
        ),
        React.createElement("linearGradient", { id: "cs-darkBg", x1: "0%", y1: "0%", x2: "100%", y2: "100%" },
          React.createElement("stop", { offset: "0%", stopColor: "#0F172A" }),
          React.createElement("stop", { offset: "100%", stopColor: "#1E293B" })
        )
      ),
      React.createElement("rect", { width: "512", height: "512", rx: "108", fill: "url(#cs-darkBg)" }),
      React.createElement("path", { d: "M0 128H512M0 256H512M0 384H512M128 0V512M256 0V512M384 0V512", stroke: "#1E293B", strokeWidth: "2", opacity: "0.5" }),
      React.createElement("circle", { cx: "100", cy: "110", r: "8", fill: "#FACC15", filter: "url(#cs-neonGlow)" }),
      React.createElement("circle", { cx: "430", cy: "120", r: "6", fill: "#F472B6", filter: "url(#cs-neonGlow)" }),
      React.createElement("circle", { cx: "80", cy: "400", r: "10", fill: "#22D3EE", filter: "url(#cs-neonGlow)" }),
      React.createElement("g", { id: "cs-neon-slither" },
        React.createElement("g", { filter: "url(#cs-neonGlow)" },
          React.createElement("circle", { cx: "130", cy: "380", r: "35", stroke: "url(#cs-neonBody)", strokeWidth: "6", fill: "none" }),
          React.createElement("circle", { cx: "175", cy: "325", r: "38", stroke: "url(#cs-neonBody)", strokeWidth: "6", fill: "none" }),
          React.createElement("circle", { cx: "235", cy: "290", r: "42", stroke: "url(#cs-neonBody)", strokeWidth: "6", fill: "none" }),
          React.createElement("circle", { cx: "310", cy: "265", r: "48", stroke: "url(#cs-neonBody)", strokeWidth: "6", fill: "none" })
        ),
        React.createElement("circle", { cx: "130", cy: "380", r: "35", fill: "#0F172A", stroke: "url(#cs-neonBody)", strokeWidth: "2" }),
        React.createElement("circle", { cx: "175", cy: "325", r: "38", fill: "#0F172A", stroke: "url(#cs-neonBody)", strokeWidth: "2" }),
        React.createElement("circle", { cx: "235", cy: "290", r: "42", fill: "#0F172A", stroke: "url(#cs-neonBody)", strokeWidth: "2" }),
        React.createElement("circle", { cx: "310", cy: "265", r: "48", fill: "#0F172A", stroke: "url(#cs-neonBody)", strokeWidth: "2" }),
        React.createElement("g", { id: "cs-head-group" },
          React.createElement("circle", { cx: "385", cy: "215", r: "62", stroke: "url(#cs-neonBody)", strokeWidth: "8", fill: "none", filter: "url(#cs-neonGlow)" }),
          React.createElement("circle", { cx: "385", cy: "215", r: "62", fill: "#0F172A", stroke: "url(#cs-neonBody)", strokeWidth: "3" }),
          React.createElement("g", { id: "cs-eyes-fixed" },
            React.createElement("circle", { cx: "360", cy: "185", r: "24", fill: "#0F172A" }),
            React.createElement("circle", { cx: "360", cy: "185", r: "20", stroke: "#22D3EE", strokeWidth: "2", fill: "none" }),
            React.createElement("circle", { cx: "358", cy: "182", r: "8", fill: "#22D3EE", filter: "url(#cs-neonGlow)" }),
            React.createElement("circle", { cx: "415", cy: "205", r: "24", fill: "#0F172A" }),
            React.createElement("circle", { cx: "415", cy: "205", r: "20", stroke: "#22D3EE", strokeWidth: "2", fill: "none" }),
            React.createElement("circle", { cx: "418", cy: "202", r: "8", fill: "#22D3EE", filter: "url(#cs-neonGlow)" })
          ),
          React.createElement("path", { d: "M370 240 A 30 30 0 0 0 410 245", stroke: "white", strokeWidth: "4", strokeLinecap: "round", strokeOpacity: "0.2" })
        )
      ),
      React.createElement("circle", { cx: "350", cy: "400", r: "2", fill: "#4ADE80", filter: "url(#cs-neonGlow)" }),
      React.createElement("circle", { cx: "200", cy: "150", r: "1.5", fill: "#22D3EE", filter: "url(#cs-neonGlow)" })
    );

export const CustomUnoIcon = ({ size, className }: { size?: number | string, className?: string }) =>
    React.createElement("svg", { width: size, height: size, viewBox: "0 0 512 512", fill: "none", xmlns: "http://www.w3.org/2000/svg", className },
        React.createElement("defs", null,
            React.createElement("filter", { id: "uno-cardShadow", x: "-30%", y: "-30%", width: "160%", height: "160%" },
                React.createElement("feGaussianBlur", { in: "SourceAlpha", stdDeviation: "5" }),
                React.createElement("feOffset", { dx: "0", dy: "3", result: "offsetblur" }),
                React.createElement("feFlood", { floodColor: "#000", floodOpacity: "0.4" }),
                React.createElement("feComposite", { in2: "offsetblur", operator: "in" }),
                React.createElement("feMerge", null,
                    React.createElement("feMergeNode", null),
                    React.createElement("feMergeNode", { in: "SourceGraphic" })
                )
            ),
            React.createElement("linearGradient", { id: "uno-colorRed", x1: "0%", y1: "0%", x2: "0%", y2: "100%" },
                React.createElement("stop", { offset: "0%", stopColor: "#ff4b2b" }),
                React.createElement("stop", { offset: "100%", stopColor: "#ff416c" })
            ),
            React.createElement("linearGradient", { id: "uno-colorBlue", x1: "0%", y1: "0%", x2: "0%", y2: "100%" },
                React.createElement("stop", { offset: "0%", stopColor: "#00c6ff" }),
                React.createElement("stop", { offset: "100%", stopColor: "#0072ff" })
            ),
            React.createElement("linearGradient", { id: "uno-colorYellow", x1: "0%", y1: "0%", x2: "0%", y2: "100%" },
                React.createElement("stop", { offset: "0%", stopColor: "#f7ff00" }),
                React.createElement("stop", { offset: "100%", stopColor: "#dbb400" })
            ),
            React.createElement("linearGradient", { id: "uno-colorGreen", x1: "0%", y1: "0%", x2: "0%", y2: "100%" },
                React.createElement("stop", { offset: "0%", stopColor: "#56ab2f" }),
                React.createElement("stop", { offset: "100%", stopColor: "#a8e063" })
            ),
            React.createElement("radialGradient", { id: "uno-bgRadial", cx: "50%", cy: "50%", r: "50%" },
                React.createElement("stop", { offset: "0%", stopColor: "#2c3e50" }),
                React.createElement("stop", { offset: "100%", stopColor: "#0c0c0c" })
            )
        ),
        React.createElement("rect", { width: "512", height: "512", rx: "40", fill: "url(#uno-bgRadial)" }),
        React.createElement("g", { transform: "translate(256, 460)" },
            React.createElement("g", { transform: "rotate(-40)", filter: "url(#uno-cardShadow)" },
                React.createElement("rect", { x: "-85", y: "-320", width: "170", height: "260", rx: "15", fill: "url(#uno-colorBlue)", stroke: "white", strokeWidth: "4" }),
                React.createElement("text", { x: "-70", y: "-285", fontFamily: "Arial, sans-serif", fontWeight: "900", fontSize: "34", fill: "white" }, "7")
            ),
            React.createElement("g", { transform: "rotate(-20)", filter: "url(#uno-cardShadow)" },
                React.createElement("rect", { x: "-85", y: "-320", width: "170", height: "260", rx: "15", fill: "url(#uno-colorRed)", stroke: "white", strokeWidth: "4" }),
                React.createElement("text", { x: "-70", y: "-285", fontFamily: "Arial, sans-serif", fontWeight: "900", fontSize: "30", fill: "white" }, "⇄")
            ),
            React.createElement("g", { transform: "rotate(0)", filter: "url(#uno-cardShadow)" },
                React.createElement("rect", { x: "-85", y: "-320", width: "170", height: "260", rx: "15", fill: "url(#uno-colorYellow)", stroke: "white", strokeWidth: "4" }),
                React.createElement("text", { x: "-70", y: "-285", fontFamily: "Arial, sans-serif", fontWeight: "900", fontSize: "34", fill: "white" }, "2")
            ),
            React.createElement("g", { transform: "rotate(20)", filter: "url(#uno-cardShadow)" },
                React.createElement("rect", { x: "-85", y: "-320", width: "170", height: "260", rx: "15", fill: "url(#uno-colorGreen)", stroke: "white", strokeWidth: "4" }),
                React.createElement("text", { x: "-70", y: "-285", fontFamily: "Arial, sans-serif", fontWeight: "900", fontSize: "34", fill: "white" }, "8"),
                React.createElement("text", { x: "0", y: "-190", fontFamily: "Arial, sans-serif", fontWeight: "900", fontSize: "80", fill: "white", fillOpacity: "0.3", textAnchor: "middle" }, "8")
            ),
            React.createElement("g", { transform: "rotate(40)", filter: "url(#uno-cardShadow)" },
                React.createElement("rect", { x: "-85", y: "-320", width: "170", height: "260", rx: "15", fill: "#1a1a1a", stroke: "white", strokeWidth: "5" }),
                React.createElement("text", { x: "-72", y: "-285", fontFamily: "Arial, sans-serif", fontWeight: "900", fontSize: "30", fill: "white" }, "+4"),
                React.createElement("ellipse", { cx: "0", cy: "-190", rx: "60", ry: "85", fill: "white", fillOpacity: "0.1" }),
                React.createElement("g", { transform: "translate(0, -190)" },
                    React.createElement("path", { d: "M-35,-50 L0,-50 L0,0 L-35,0 Z", fill: "#ff416c" }),
                    React.createElement("path", { d: "M0,-50 L35,-50 L35,0 L0,0 Z", fill: "#0072ff" }),
                    React.createElement("path", { d: "M-35,0 L0,0 L0,50 L-35,50 Z", fill: "#dbb400" }),
                    React.createElement("path", { d: "M0,0 L35,0 L35,50 L0,50 Z", fill: "#56ab2f" }),
                    React.createElement("text", { x: "0", y: "12", fontFamily: "Arial, sans-serif", fontWeight: "900", fontSize: "40", fill: "white", textAnchor: "middle", stroke: "black", strokeWidth: "1" }, "+4")
                )
            )
        )
    );

export const CustomUltraConnect4Icon = ({ size = "100%", className = "" }: { size?: number | string, className?: string }) =>
    React.createElement("svg", { width: size, height: size, viewBox: "0 0 512 512", fill: "none", xmlns: "http://www.w3.org/2000/svg", className },
      React.createElement("defs", null,
        React.createElement("filter", { id: "c4-neonGlow", x: "-200%", y: "-200%", width: "500%", height: "500%" },
          React.createElement("feGaussianBlur", { stdDeviation: "18", result: "blur" }),
          React.createElement("feComposite", { in: "SourceGraphic", in2: "blur", operator: "over" })
        ),
        React.createElement("filter", { id: "c4-orbRefraction" },
          React.createElement("feGaussianBlur", { stdDeviation: "3", result: "blur" }),
          React.createElement("feSpecularLighting", { surfaceScale: "6", specularConstant: "1.2", specularExponent: "35", lightingColor: "#ffffff", in: "blur", result: "spec" },
            React.createElement("fePointLight", { x: "-5000", y: "-10000", z: "20000" })
          ),
          React.createElement("feComposite", { in: "spec", in2: "SourceGraphic", operator: "in", result: "comp" }),
          React.createElement("feComposite", { in: "SourceGraphic", in2: "comp", operator: "over" })
        ),
        React.createElement("radialGradient", { id: "c4-pinkOrb", cx: "35%", cy: "35%", r: "65%" },
          React.createElement("stop", { offset: "0%", stopColor: "#FFD1E3" }),
          React.createElement("stop", { offset: "50%", stopColor: "#F472B6" }),
          React.createElement("stop", { offset: "100%", stopColor: "#831843" })
        ),
        React.createElement("radialGradient", { id: "c4-blueOrb", cx: "35%", cy: "35%", r: "65%" },
          React.createElement("stop", { offset: "0%", stopColor: "#A5F3FC" }),
          React.createElement("stop", { offset: "50%", stopColor: "#22D3EE" }),
          React.createElement("stop", { offset: "100%", stopColor: "#0E7490" })
        ),
        React.createElement("linearGradient", { id: "c4-laserGrad", x1: "0", y1: "0", x2: "0", y2: "1" },
          React.createElement("stop", { offset: "0%", stopColor: "white", stopOpacity: "0" }),
          React.createElement("stop", { offset: "50%", stopColor: "white", stopOpacity: "0.3" }),
          React.createElement("stop", { offset: "100%", stopColor: "white", stopOpacity: "0" })
        )
      ),
      React.createElement("rect", { width: "512", height: "512", rx: "108", fill: "#020617" }),
      React.createElement("circle", { cx: "256", cy: "512", r: "300", fill: "#1E293B", opacity: "0.2" }),
      React.createElement("g", { id: "c4-laser-guides", opacity: "0.6" },
        React.createElement("rect", { x: "100", y: "80", width: "2", height: "352", fill: "url(#c4-laserGrad)" }),
        React.createElement("rect", { x: "180", y: "80", width: "2", height: "352", fill: "url(#c4-laserGrad)" }),
        React.createElement("rect", { x: "260", y: "80", width: "2", height: "352", fill: "url(#c4-laserGrad)" }),
        React.createElement("rect", { x: "340", y: "80", width: "2", height: "352", fill: "url(#c4-laserGrad)" }),
        React.createElement("rect", { x: "420", y: "80", width: "2", height: "352", fill: "url(#c4-laserGrad)" })
      ),
      React.createElement("g", { id: "c4-orbs", filter: "url(#c4-orbRefraction)" },
        React.createElement("circle", { cx: "140", cy: "380", r: "34", fill: "url(#c4-blueOrb)", filter: "url(#c4-neonGlow)" }),
        React.createElement("circle", { cx: "220", cy: "380", r: "34", fill: "url(#c4-pinkOrb)", filter: "url(#c4-neonGlow)" }),
        React.createElement("circle", { cx: "220", cy: "300", r: "34", fill: "url(#c4-blueOrb)", filter: "url(#c4-neonGlow)" }),
        React.createElement("circle", { cx: "300", cy: "380", r: "34", fill: "url(#c4-pinkOrb)", filter: "url(#c4-neonGlow)" }),
        React.createElement("circle", { cx: "300", cy: "300", r: "34", fill: "url(#c4-pinkOrb)", filter: "url(#c4-neonGlow)" }),
        React.createElement("circle", { cx: "300", cy: "220", r: "34", fill: "url(#c4-pinkOrb)", filter: "url(#c4-neonGlow)" }),
        React.createElement("circle", { cx: "380", cy: "380", r: "34", fill: "url(#c4-blueOrb)", filter: "url(#c4-neonGlow)" }),
        React.createElement("g", { transform: "translate(300, 100)" },
          React.createElement("circle", { cx: "0", cy: "0", r: "34", fill: "url(#c4-pinkOrb)", filter: "url(#c4-neonGlow)" }),
          React.createElement("path", { d: "M0 -70 V-40", stroke: "#F472B6", strokeWidth: "6", strokeLinecap: "round", opacity: "0.5", filter: "url(#c4-neonGlow)" })
        )
      ),
      React.createElement("g", { opacity: "0.4", stroke: "white", strokeWidth: "2" },
        React.createElement("path", { d: "M120 450 H160 M200 450 H240 M280 450 H320 M360 450 H400", strokeLinecap: "round" })
      ),
      React.createElement("circle", { cx: "100", cy: "100", r: "2", fill: "white", opacity: "0.3" }),
      React.createElement("circle", { cx: "400", cy: "450", r: "1.5", fill: "white", opacity: "0.2" }),
      React.createElement("circle", { cx: "450", cy: "80", r: "2.5", fill: "#22D3EE", opacity: "0.2", filter: "url(#c4-neonGlow)" })
    );

export const CustomNeonMixIcon = ({ size, className }: { size?: number | string, className?: string }) => 
    React.createElement("svg", { width: size, height: size, viewBox: "0 0 512 512", fill: "none", xmlns: "http://www.w3.org/2000/svg", className },
      React.createElement("defs", null,
        React.createElement("radialGradient", { id: "bg_grad", cx: "50%", cy: "50%", r: "50%", fx: "50%", fy: "50%" },
          React.createElement("stop", { offset: "0%", stopColor: "#252535" }),
          React.createElement("stop", { offset: "100%", stopColor: "#05050A" })
        ),
        React.createElement("filter", { id: "glow_strong", x: "-50%", y: "-50%", width: "200%", height: "200%" },
          React.createElement("feGaussianBlur", { stdDeviation: "8", result: "blur" }),
          React.createElement("feComposite", { in: "SourceGraphic", in2: "blur", operator: "over" })
        ),
        React.createElement("linearGradient", { id: "color_purple", x1: "0%", y1: "0%", x2: "0%", y2: "100%" },
          React.createElement("stop", { offset: "0%", stopColor: "#D070FF" }),
          React.createElement("stop", { offset: "100%", stopColor: "#6B69FF" })
        ),
        React.createElement("linearGradient", { id: "color_cyan", x1: "0%", y1: "0%", x2: "0%", y2: "100%" },
          React.createElement("stop", { offset: "0%", stopColor: "#60E0FF" }),
          React.createElement("stop", { offset: "100%", stopColor: "#0080FF" })
        ),
        React.createElement("linearGradient", { id: "color_pink", x1: "0%", y1: "0%", x2: "0%", y2: "100%" },
          React.createElement("stop", { offset: "0%", stopColor: "#FF5080" }),
          React.createElement("stop", { offset: "100%", stopColor: "#FF2050" })
        ),
        React.createElement("path", { id: "large_flask_path", d: "M0 15 C0 6.7, 6.7 0, 15 0 H85 C93.3 0, 100 6.7, 100 15 V280 C100 307.6, 77.6 330, 50 330 C22.4 330, 0 307.6, 0 280 Z" }),
        React.createElement("clipPath", { id: "large_flask_clip" },
          React.createElement("use", { href: "#large_flask_path" })
        )
      ),
      React.createElement("rect", { width: "512", height: "512", rx: "120", fill: "url(#bg_grad)" }),
      React.createElement("g", { transform: "translate(70, 90)" },
        React.createElement("use", { href: "#large_flask_path", fill: "rgba(255,255,255,0.05)", stroke: "rgba(255,255,255,0.25)", strokeWidth: "4" }),
        React.createElement("g", { clipPath: "url(#large_flask_clip)" },
          React.createElement("rect", { y: "230", width: "100", height: "100", fill: "url(#color_cyan)" }),
          React.createElement("rect", { y: "140", width: "100", height: "90", fill: "url(#color_pink)" }),
          React.createElement("rect", { y: "50", width: "100", height: "90", fill: "url(#color_purple)" })
        ),
        React.createElement("rect", { x: "12", y: "25", width: "8", height: "260", rx: "4", fill: "white", fillOpacity: "0.1" })
      ),
      React.createElement("g", { transform: "translate(206, 90)" },
        React.createElement("use", { href: "#large_flask_path", fill: "rgba(255,255,255,0.08)", stroke: "rgba(255,255,255,0.5)", strokeWidth: "5" }),
        React.createElement("g", { clipPath: "url(#large_flask_clip)" },
          React.createElement("rect", { y: "180", width: "100", height: "150", fill: "url(#color_pink)", filter: "url(#glow_strong)" }),
          React.createElement("rect", { y: "70", width: "100", height: "110", fill: "url(#color_purple)", filter: "url(#glow_strong)" })
        ),
        React.createElement("rect", { x: "12", y: "25", width: "8", height: "260", rx: "4", fill: "white", fillOpacity: "0.15" })
      ),
      React.createElement("g", { transform: "translate(342, 90)" },
        React.createElement("use", { href: "#large_flask_path", fill: "rgba(255,255,255,0.05)", stroke: "rgba(255,255,255,0.25)", strokeWidth: "4" }),
        React.createElement("g", { clipPath: "url(#large_flask_clip)" },
          React.createElement("rect", { y: "40", width: "100", height: "290", fill: "url(#color_cyan)", filter: "url(#glow_strong)" })
        ),
        React.createElement("circle", { cx: "50", cy: "165", r: "35", fill: "white", fillOpacity: "0.15", filter: "url(#glow_strong)" }),
        React.createElement("path", { d: "M35 165 L45 175 L65 155", stroke: "white", strokeWidth: "8", strokeLinecap: "round", strokeLinejoin: "round" }),
        React.createElement("rect", { x: "12", y: "25", width: "8", height: "260", rx: "4", fill: "white", fillOpacity: "0.1" })
      ),
      React.createElement("g", { opacity: "0.6" },
        React.createElement("rect", { x: "65", y: "90", width: "110", height: "6", rx: "3", fill: "white", fillOpacity: "0.2" }),
        React.createElement("rect", { x: "201", y: "90", width: "110", height: "6", rx: "3", fill: "white", fillOpacity: "0.2" }),
        React.createElement("rect", { x: "337", y: "90", width: "110", height: "6", rx: "3", fill: "white", fillOpacity: "0.2" })
      )
    );

export const CustomUltraStackIcon = ({ size = "100%", className = "" }: { size?: number | string, className?: string }) => 
    React.createElement("svg", { width: size, height: size, viewBox: "0 0 512 512", fill: "none", xmlns: "http://www.w3.org/2000/svg", className },
      React.createElement("defs", null,
        React.createElement("filter", { id: "st-neonGlow", x: "-200%", y: "-200%", width: "500%", height: "500%" },
          React.createElement("feGaussianBlur", { stdDeviation: "15", result: "blur" }),
          React.createElement("feComposite", { in: "SourceGraphic", in2: "blur", operator: "over" })
        ),
        React.createElement("linearGradient", { id: "st-stableGrad", x1: "0%", y1: "0%", x2: "100%", y2: "100%" },
          React.createElement("stop", { offset: "0%", stopColor: "#22D3EE" }),
          React.createElement("stop", { offset: "100%", stopColor: "#0891B2" })
        ),
        React.createElement("linearGradient", { id: "st-activeGrad", x1: "0%", y1: "0%", x2: "100%", y2: "100%" },
          React.createElement("stop", { offset: "0%", stopColor: "#F472B6" }),
          React.createElement("stop", { offset: "100%", stopColor: "#9D174D" })
        ),
        React.createElement("linearGradient", { id: "st-shineGrad", x1: "0%", y1: "0%", x2: "100%", y2: "100%" },
          React.createElement("stop", { offset: "0%", stopColor: "white", stopOpacity: "0.4" }),
          React.createElement("stop", { offset: "50%", stopColor: "white", stopOpacity: "0.1" }),
          React.createElement("stop", { offset: "100%", stopColor: "white", stopOpacity: "0" })
        )
      ),
      React.createElement("rect", { width: "512", height: "512", rx: "108", fill: "#020617" }),
      React.createElement("circle", { cx: "256", cy: "300", r: "200", fill: "#22D3EE", opacity: "0.05", filter: "url(#st-neonGlow)" }),
      React.createElement("g", { transform: "translate(256, 420)" },
        React.createElement("g", { transform: "translate(0, 0)" },
          React.createElement("path", { d: "M-120 -30 L0 -60 L120 -30 L0 0 Z", fill: "url(#st-stableGrad)", stroke: "#22D3EE", strokeWidth: "2" }),
          React.createElement("path", { d: "M-120 -30 L-120 10 L0 40 L0 0 Z", fill: "#164E63", stroke: "#22D3EE", strokeWidth: "2" }),
          React.createElement("path", { d: "M120 -30 L120 10 L0 40 L0 0 Z", fill: "#0891B2", stroke: "#22D3EE", strokeWidth: "2" })
        ),
        React.createElement("g", { transform: "translate(0, -50)" },
          React.createElement("path", { d: "M-120 -30 L0 -60 L120 -30 L0 0 Z", fill: "url(#st-stableGrad)", stroke: "#22D3EE", strokeWidth: "2" }),
          React.createElement("path", { d: "M-120 -30 L-120 10 L0 40 L0 0 Z", fill: "#164E63", stroke: "#22D3EE", strokeWidth: "2" }),
          React.createElement("path", { d: "M120 -30 L120 10 L0 40 L0 0 Z", fill: "#0891B2", stroke: "#22D3EE", strokeWidth: "2" }),
          React.createElement("rect", { x: "-110", y: "-25", width: "220", height: "15", fill: "url(#st-shineGrad)", opacity: "0.3" })
        ),
        React.createElement("g", { transform: "translate(0, -100)" },
          React.createElement("path", { d: "M-120 -30 L0 -60 L120 -30 L0 0 Z", fill: "url(#st-stableGrad)", stroke: "#22D3EE", strokeWidth: "2" }),
          React.createElement("path", { d: "M-120 -30 L-120 10 L0 40 L0 0 Z", fill: "#164E63", stroke: "#22D3EE", strokeWidth: "2" }),
          React.createElement("path", { d: "M120 -30 L120 10 L0 40 L0 0 Z", fill: "#0891B2", stroke: "#22D3EE", strokeWidth: "2" })
        ),
        React.createElement("g", { transform: "translate(40, -170)" },
          React.createElement("path", { d: "M-120 -30 L0 -60 L120 -30 L0 0 Z", fill: "url(#st-activeGrad)", stroke: "#F472B6", strokeWidth: "4", filter: "url(#st-neonGlow)" }),
          React.createElement("path", { d: "M-120 -30 L-120 10 L0 40 L0 0 Z", fill: "#831843", stroke: "#F472B6", strokeWidth: "2" }),
          React.createElement("path", { d: "M120 -30 L120 10 L0 40 L0 0 Z", fill: "#9D174D", stroke: "#F472B6", strokeWidth: "2" }),
          React.createElement("path", { d: "M130 -30 L200 -30", stroke: "#F472B6", strokeWidth: "4", strokeLinecap: "round", opacity: "0.4", filter: "url(#st-neonGlow)" }),
          React.createElement("path", { d: "M130 -10 L180 -10", stroke: "#F472B6", strokeWidth: "2", strokeLinecap: "round", opacity: "0.2" })
        )
      ),
      React.createElement("g", { opacity: "0.4" },
        React.createElement("line", { x1: "256", y1: "50", x2: "256", y2: "150", stroke: "#22D3EE", strokeWidth: "2", strokeDasharray: "8 8" }),
        React.createElement("path", { d: "M236 60 L256 40 L276 60", stroke: "#22D3EE", strokeWidth: "3", fill: "none" })
      ),
      React.createElement("circle", { cx: "400", cy: "150", r: "4", fill: "#F472B6", filter: "url(#st-neonGlow)" }),
      React.createElement("circle", { cx: "100", cy: "200", r: "3", fill: "#22D3EE", filter: "url(#st-neonGlow)" }),
      React.createElement("circle", { cx: "450", cy: "350", r: "2", fill: "white", opacity: "0.5" }),
      React.createElement("rect", { x: "20", y: "20", width: "472", height: "472", rx: "108", stroke: "white", strokeOpacity: "0.05", strokeWidth: "2" })
    );

export const CustomAirHockeyIcon = ({ size = 24, className = "" }: { size?: number | string, className?: string }) => 
    React.createElement("svg", { width: size, height: size, viewBox: "0 0 512 512", fill: "none", xmlns: "http://www.w3.org/2000/svg", className },
      React.createElement("defs", null,
        React.createElement("filter", { id: "ah-glow", x: "-100%", y: "-100%", width: "300%", height: "300%" },
          React.createElement("feGaussianBlur", { stdDeviation: "15", result: "blur" }),
          React.createElement("feComposite", { in: "SourceGraphic", in2: "blur", operator: "over" })
        ),
        React.createElement("filter", { id: "ah-shadow", x: "-50%", y: "-50%", width: "200%", height: "200%" },
          React.createElement("feDropShadow", { dx: "0", dy: "15", stdDeviation: "12", floodOpacity: "0.5" })
        ),
        React.createElement("linearGradient", { id: "ah-tableBg", x1: "0%", y1: "0%", x2: "100%", y2: "100%" },
          React.createElement("stop", { offset: "0%", stopColor: "#0F172A" }),
          React.createElement("stop", { offset: "100%", stopColor: "#1E293B" })
        ),
        React.createElement("radialGradient", { id: "ah-strikerBody", cx: "40%", cy: "30%", r: "70%" },
          React.createElement("stop", { offset: "0%", stopColor: "#38BDF8" }),
          React.createElement("stop", { offset: "70%", stopColor: "#0369A1" }),
          React.createElement("stop", { offset: "100%", stopColor: "#082F49" })
        ),
        React.createElement("radialGradient", { id: "ah-puckBody", cx: "40%", cy: "30%", r: "70%" },
          React.createElement("stop", { offset: "0%", stopColor: "#F87171" }),
          React.createElement("stop", { offset: "80%", stopColor: "#B91C1C" }),
          React.createElement("stop", { offset: "100%", stopColor: "#7F1D1D" })
        )
      ),
      React.createElement("rect", { width: "512", height: "512", rx: "108", fill: "url(#ah-tableBg)" }),
      React.createElement("rect", { x: "40", y: "40", width: "432", height: "432", rx: "20", stroke: "#334155", strokeWidth: "2", fill: "none", opacity: "0.3" }),
      React.createElement("circle", { cx: "256", cy: "256", r: "160", stroke: "#334155", strokeWidth: "4", fill: "none", opacity: "0.2" }),
      React.createElement("line", { x1: "256", y1: "40", x2: "256", y2: "472", stroke: "#334155", strokeWidth: "2", strokeDasharray: "12 8" }),
      React.createElement("g", { filter: "url(#ah-shadow)" },
        React.createElement("circle", { cx: "380", cy: "350", r: "45", fill: "url(#ah-puckBody)", filter: "url(#ah-glow)" }),
        React.createElement("circle", { cx: "380", cy: "350", r: "38", stroke: "white", strokeWidth: "2", strokeOpacity: "0.3", fill: "none" }),
        React.createElement("ellipse", { cx: "365", cy: "335", rx: "15", ry: "8", fill: "white", fillOpacity: "0.25", transform: "rotate(-30, 365, 335)" })
      ),
      React.createElement("g", { filter: "url(#ah-shadow)" },
        React.createElement("circle", { cx: "210", cy: "240", r: "95", fill: "url(#ah-strikerBody)", filter: "url(#ah-glow)" }),
        React.createElement("circle", { cx: "210", cy: "240", r: "65", fill: "#0EA5E9", stroke: "#0369A1", strokeWidth: "3" }),
        React.createElement("circle", { cx: "210", cy: "240", r: "35", fill: "#0C4A6E" }),
        React.createElement("circle", { cx: "210", cy: "240", r: "28", fill: "url(#ah-strikerBody)" }),
        React.createElement("path", { d: "M145 240 A 65 65 0 0 1 210 175", stroke: "white", strokeWidth: "6", strokeLinecap: "round", strokeOpacity: "0.4" }),
        React.createElement("circle", { cx: "180", cy: "210", r: "4", fill: "white", fillOpacity: "0.6" })
      ),
      React.createElement("circle", { cx: "320", cy: "290", r: "2.5", fill: "#38BDF8", opacity: "0.4" }),
      React.createElement("circle", { cx: "300", cy: "360", r: "2", fill: "#F87171", opacity: "0.4" })
    );

export const CustomUltraMastermindIcon = ({ size = "100%", className = "" }: { size?: number | string, className?: string }) => 
    React.createElement("svg", { width: size, height: size, viewBox: "0 0 512 512", fill: "none", xmlns: "http://www.w3.org/2000/svg", className },
      React.createElement("defs", null,
        React.createElement("filter", { id: "mm-glow", x: "-50%", y: "-50%", width: "200%", height: "200%" },
          React.createElement("feGaussianBlur", { stdDeviation: "15", result: "blur" }),
          React.createElement("feComposite", { in: "SourceGraphic", in2: "blur", operator: "over" })
        ),
        React.createElement("radialGradient", { id: "mm-bgGrad", cx: "50%", cy: "50%", r: "50%", fx: "50%", fy: "50%" },
          React.createElement("stop", { offset: "0%", stopColor: "#1a1a2e" }),
          React.createElement("stop", { offset: "100%", stopColor: "#0f0f1b" })
        ),
        React.createElement("filter", { id: "mm-redGlow", x: "-50%", y: "-50%", width: "200%", height: "200%" }, React.createElement("feGaussianBlur", { stdDeviation: "12", result: "blur" }), React.createElement("feMerge", null, React.createElement("feMergeNode", { in: "blur" }), React.createElement("feMergeNode", { in: "SourceGraphic" }))),
        React.createElement("filter", { id: "mm-blueGlow", x: "-50%", y: "-50%", width: "200%", height: "200%" }, React.createElement("feGaussianBlur", { stdDeviation: "12", result: "blur" }), React.createElement("feMerge", null, React.createElement("feMergeNode", { in: "blur" }), React.createElement("feMergeNode", { in: "SourceGraphic" }))),
        React.createElement("filter", { id: "mm-yellowGlow", x: "-50%", y: "-50%", width: "200%", height: "200%" }, React.createElement("feGaussianBlur", { stdDeviation: "12", result: "blur" }), React.createElement("feMerge", null, React.createElement("feMergeNode", { in: "blur" }), React.createElement("feMergeNode", { in: "SourceGraphic" }))),
        React.createElement("filter", { id: "mm-greenGlow", x: "-50%", y: "-50%", width: "200%", height: "200%" }, React.createElement("feGaussianBlur", { stdDeviation: "12", result: "blur" }), React.createElement("feMerge", null, React.createElement("feMergeNode", { in: "blur" }), React.createElement("feMergeNode", { in: "SourceGraphic" }))),
        React.createElement("filter", { id: "mm-orangeGlow", x: "-50%", y: "-50%", width: "200%", height: "200%" }, React.createElement("feGaussianBlur", { stdDeviation: "12", result: "blur" }), React.createElement("feMerge", null, React.createElement("feMergeNode", { in: "blur" }), React.createElement("feMergeNode", { in: "SourceGraphic" }))),
        React.createElement("filter", { id: "mm-purpleGlow", x: "-50%", y: "-50%", width: "200%", height: "200%" }, React.createElement("feGaussianBlur", { stdDeviation: "12", result: "blur" }), React.createElement("feMerge", null, React.createElement("feMergeNode", { in: "blur" }), React.createElement("feMergeNode", { in: "SourceGraphic" })))
      ),
      React.createElement("rect", { width: "512", height: "512", rx: "80", fill: "url(#mm-bgGrad)" }),
      React.createElement("rect", { x: "10", y: "10", width: "492", height: "492", rx: "75", stroke: "#4834d4", strokeWidth: "2", strokeOpacity: "0.3", fill: "none" }),
      React.createElement("circle", { cx: "130", cy: "150", r: "50", fill: "#ff4d4d", filter: "url(#mm-redGlow)" }),
      React.createElement("circle", { cx: "256", cy: "150", r: "50", fill: "#00d2ff", filter: "url(#mm-blueGlow)" }),
      React.createElement("circle", { cx: "382", cy: "150", r: "50", fill: "#fff200", filter: "url(#mm-yellowGlow)" }),
      React.createElement("circle", { cx: "130", cy: "280", r: "50", fill: "#32ff7e", filter: "url(#mm-greenGlow)" }),
      React.createElement("circle", { cx: "256", cy: "280", r: "50", fill: "#ffaf40", filter: "url(#mm-orangeGlow)" }),
      React.createElement("circle", { cx: "382", cy: "280", r: "50", fill: "#c56cf0", filter: "url(#mm-purpleGlow)" }),
      React.createElement("g", { transform: "translate(100, 390)" },
        React.createElement("rect", { width: "312", height: "70", rx: "15", fill: "#161625", stroke: "#4834d4", strokeWidth: "1", strokeOpacity: "0.5" }),
        React.createElement("circle", { cx: "50", cy: "35", r: "12", fill: "#ffffff", filter: "url(#mm-glow)" }),
        React.createElement("circle", { cx: "100", cy: "35", r: "12", fill: "#ff4d4d", filter: "url(#mm-redGlow)" }),
        React.createElement("circle", { cx: "150", cy: "35", r: "12", fill: "none", stroke: "#4834d4", strokeWidth: "2" }),
        React.createElement("circle", { cx: "200", cy: "35", r: "12", fill: "none", stroke: "#4834d4", strokeWidth: "2" }),
        React.createElement("circle", { cx: "250", cy: "35", r: "12", fill: "#ffffff", filter: "url(#mm-glow)", opacity: "0.6" })
      ),
      React.createElement("path", { d: "M80 20 Q256 10 432 20", stroke: "white", strokeWidth: "2", strokeOpacity: "0.1", fill: "none" })
    );

export const CustomUltraMemoryIcon = ({ size = "100%", className = "" }: { size?: number | string, className?: string }) =>
    React.createElement("svg", { width: size, height: size, viewBox: "0 0 512 512", fill: "none", xmlns: "http://www.w3.org/2000/svg", className },
        React.createElement("defs", null,
            React.createElement("filter", { id: "mem-neonBlue", x: "-50%", y: "-50%", width: "200%", height: "200%" },
                React.createElement("feGaussianBlur", { stdDeviation: "6", result: "blur" }),
                React.createElement("feFlood", { floodColor: "#00d2ff", floodOpacity: "0.8", result: "color" }),
                React.createElement("feComposite", { in: "color", in2: "blur", operator: "in" }),
                React.createElement("feMerge", null,
                    React.createElement("feMergeNode", null),
                    React.createElement("feMergeNode", { in: "SourceGraphic" })
                )
            ),
            React.createElement("filter", { id: "mem-neonPink", x: "-50%", y: "-50%", width: "200%", height: "200%" },
                React.createElement("feGaussianBlur", { stdDeviation: "8", result: "blur" }),
                React.createElement("feFlood", { floodColor: "#ff00ff", floodOpacity: "0.9", result: "color" }),
                React.createElement("feComposite", { in: "color", in2: "blur", operator: "in" }),
                React.createElement("feMerge", null,
                    React.createElement("feMergeNode", null),
                    React.createElement("feMergeNode", { in: "SourceGraphic" })
                )
            ),
            React.createElement("radialGradient", { id: "mem-darkBg", cx: "50%", cy: "50%", r: "50%", fx: "50%", fy: "50%" },
                React.createElement("stop", { offset: "0%", stopColor: "#1a1a2e" }),
                React.createElement("stop", { offset: "100%", stopColor: "#020205" })
            )
        ),
        React.createElement("rect", { width: "512", height: "512", rx: "80", fill: "url(#mem-darkBg)" }),
        React.createElement("g", { stroke: "#004466", strokeWidth: "3", opacity: "0.6" },
            React.createElement("rect", { x: "70", y: "80", width: "110", height: "150", rx: "10", fill: "#0a192f" }),
            React.createElement("rect", { x: "201", y: "80", width: "110", height: "150", rx: "10", fill: "#0a192f" }),
            React.createElement("rect", { x: "332", y: "80", width: "110", height: "150", rx: "10", fill: "#0a192f" }),
            React.createElement("rect", { x: "70", y: "260", width: "110", height: "150", rx: "10", fill: "#0a192f" }),
            React.createElement("rect", { x: "332", y: "260", width: "110", height: "150", rx: "10", fill: "#0a192f" })
        ),
        React.createElement("g", { transform: "translate(110, 200) rotate(-4)" },
            React.createElement("rect", { width: "130", height: "180", rx: "12", fill: "#0a192f", stroke: "#ff00ff", strokeWidth: "4", filter: "url(#mem-neonPink)" }),
            React.createElement("path", { d: "M75 50 L50 100 L70 100 L55 140 L85 85 L65 85 Z", stroke: "#ff00ff", strokeWidth: "3", fill: "none", filter: "url(#mem-neonPink)" })
        ),
        React.createElement("g", { transform: "translate(270, 200) rotate(4)" },
            React.createElement("rect", { width: "130", height: "180", rx: "12", fill: "#0a192f", stroke: "#ff00ff", strokeWidth: "4", filter: "url(#mem-neonPink)" }),
            React.createElement("path", { d: "M75 50 L50 100 L70 100 L55 140 L85 85 L65 85 Z", stroke: "#ff00ff", strokeWidth: "3", fill: "none", filter: "url(#mem-neonPink)" })
        ),
        React.createElement("circle", { cx: "256", cy: "450", r: "2", fill: "#ff00ff", filter: "url(#mem-neonPink)" }),
        React.createElement("circle", { cx: "100", cy: "100", r: "1.5", fill: "#00d2ff", filter: "url(#mem-neonBlue)" }),
        React.createElement("circle", { cx: "412", cy: "150", r: "1.5", fill: "#00d2ff", filter: "url(#mem-neonBlue)" })
    );

export const CustomNeonSeekIcon = ({ size = "100%", className = "" }: { size?: number | string, className?: string }) =>
  React.createElement("svg", { width: size, height: size, viewBox: "0 0 512 512", fill: "none", xmlns: "http://www.w3.org/2000/svg", className },
    React.createElement("defs", null,
      React.createElement("filter", { id: "cyanGlow", x: "-40%", y: "-40%", width: "180%", height: "180%" },
        React.createElement("feGaussianBlur", { stdDeviation: "12", result: "blur" }),
        React.createElement("feFlood", { floodColor: "#00f2ff", floodOpacity: "0.6", result: "color" }),
        React.createElement("feComposite", { in: "color", in2: "blur", operator: "in", result: "glow" }),
        React.createElement("feMerge", null,
          React.createElement("feMergeNode", { in: "glow" }),
          React.createElement("feMergeNode", { in: "SourceGraphic" })
        )
      ),
      React.createElement("filter", { id: "pinkGlow", x: "-40%", y: "-40%", width: "180%", height: "180%" },
        React.createElement("feGaussianBlur", { stdDeviation: "15", result: "blur" }),
        React.createElement("feFlood", { floodColor: "#ff0077", floodOpacity: "0.8", result: "color" }),
        React.createElement("feComposite", { in: "color", in2: "blur", operator: "in", result: "glow" }),
        React.createElement("feMerge", null,
          React.createElement("feMergeNode", { in: "glow" }),
          React.createElement("feMergeNode", { in: "SourceGraphic" })
        )
      ),
      React.createElement("linearGradient", { id: "handleGrad", x1: "0%", y1: "0%", x2: "100%", y2: "100%" },
        React.createElement("stop", { offset: "0%", stopColor: "#00f2ff" }),
        React.createElement("stop", { offset: "100%", stopColor: "#006688" })
      )
    ),
    React.createElement("rect", { width: "512", height: "512", rx: "120", fill: "#020205" }),

    React.createElement("g", { filter: "url(#cyanGlow)" },
      React.createElement("rect", { x: "340", y: "340", width: "120", height: "32", rx: "16", transform: "rotate(45 340 340)", fill: "url(#handleGrad)" }),
      React.createElement("rect", { x: "382", y: "382", width: "40", height: "32", rx: "4", transform: "rotate(45 382 382)", fill: "#020205" })
    ),

    React.createElement("g", { filter: "url(#cyanGlow)" },
      React.createElement("circle", { cx: "210", cy: "210", r: "140", stroke: "#00f2ff", strokeWidth: "20", fill: "none" }),
      React.createElement("circle", { cx: "210", cy: "210", r: "120", stroke: "white", strokeWidth: "2", strokeOpacity: "0.3", fill: "none" })
    ),

    React.createElement("g", { filter: "url(#pinkGlow)" },
      React.createElement("circle", { cx: "210", cy: "210", r: "40", stroke: "#ff0077", strokeWidth: "6", fill: "#ff0077", fillOpacity: "0.1" }),
      React.createElement("path", { d: "M210 150 V185 M210 235 V270 M150 210 H185 M235 210 H270", stroke: "#ff0077", strokeWidth: "10", strokeLinecap: "round" }),
      React.createElement("circle", { cx: "210", cy: "210", r: "10", fill: "white" })
    ),

    React.createElement("path", { d: "M120 140 C 150 100, 250 100, 300 140", stroke: "white", strokeWidth: "6", strokeLinecap: "round", strokeOpacity: "0.2" })
  );

// --- CONFIGURATIONS ---

export const GAMES_CONFIG = [
    { id: 'slither', category: 'ARCADE', name: 'CYBER SERPENT', icon: CustomCyberSerpentIcon, color: 'text-indigo-400', bg: 'bg-indigo-900/20', border: 'border-indigo-500/30', hoverBorder: 'hover:border-indigo-400', shadow: 'hover:shadow-[0_0_20px_rgba(129,140,248,0.3)]', glow: 'rgba(129,140,248,0.8)', badges: { solo: true, online: true, vs: true, new: false }, reward: 'GAINS', beta: false },
    { id: 'neon_seek', category: 'PUZZLE', name: 'NEON SEEK', icon: CustomNeonSeekIcon, color: 'text-yellow-400', bg: 'bg-yellow-900/20', border: 'border-yellow-500/30', hoverBorder: 'hover:border-yellow-400', shadow: 'hover:shadow-[0_0_20px_rgba(250,204,21,0.3)]', glow: 'rgba(250,204,21,0.8)', badges: { solo: true, online: false, vs: false, new: true }, reward: 'GAINS', beta: false },
    { id: 'lumen', category: 'PUZZLE', name: 'LUMEN ORDER', icon: CustomUltraLumenIcon, color: 'text-cyan-400', bg: 'bg-cyan-900/20', border: 'border-cyan-500/30', hoverBorder: 'hover:border-cyan-400', shadow: 'hover:shadow-[0_0_20px_rgba(34,211,238,0.3)]', glow: 'rgba(34,211,238,0.8)', badges: { solo: true, online: false, vs: false, new: false }, reward: 'GAINS', beta: true },
    { id: 'skyjo', category: 'STRATEGY', name: 'NEON SKYJO', icon: CustomUltraSkyjoIcon, color: 'text-purple-400', bg: 'bg-purple-900/20', border: 'border-purple-500/30', hoverBorder: 'hover:border-purple-400', shadow: 'hover:shadow-[0_0_20px_rgba(168,85,247,0.3)]', glow: 'rgba(168,85,247,0.8)', badges: { solo: true, online: true, vs: true, new: false }, reward: 'GAINS', beta: false },
    { id: 'arenaclash', category: 'ARCADE', name: 'ARENA CLASH', icon: CustomUltraArenaIcon, color: 'text-red-500', bg: 'bg-red-900/20', border: 'border-red-500/30', hoverBorder: 'hover:border-red-400', shadow: 'hover:shadow-[0_0_20px_rgba(239,68,68,0.3)]', glow: 'rgba(239,68,68,0.8)', badges: { solo: true, online: true, vs: false, new: false }, reward: 'GAINS', beta: true },
    { id: 'stack', category: 'ARCADE', name: 'STACK', icon: CustomUltraStackIcon, color: 'text-indigo-400', bg: 'bg-indigo-900/20', border: 'border-indigo-500/30', hoverBorder: 'hover:border-indigo-400', shadow: 'hover:shadow-[0_0_20px_rgba(129,140,248,0.3)]', glow: 'rgba(129,140,248,0.8)', badges: { solo: true, online: false, vs: false, new: false }, reward: 'GAINS', beta: false },
    { id: 'tetris', category: 'ARCADE', name: 'TETRIS', icon: CustomUltraTetrisIcon, color: 'text-cyan-400', bg: 'bg-cyan-900/20', border: 'border-cyan-500/30', hoverBorder: 'hover:border-cyan-400', shadow: 'hover:shadow-[0_0_20px_rgba(34,211,238,0.3)]', glow: 'rgba(34,211,238,0.8)', badges: { solo: true, online: false, vs: false, new: false }, reward: 'GAINS', beta: false },
    { id: 'runner', category: 'ARCADE', name: 'NEON RUN', icon: CustomUltraRunnerIcon, color: 'text-orange-400', bg: 'bg-orange-900/20', border: 'border-orange-500/30', hoverBorder: 'hover:border-orange-400', shadow: 'hover:shadow-[0_0_20px_rgba(251,146,60,0.3)]', glow: 'rgba(251,146,60,0.8)', badges: { solo: true, online: false, vs: false, new: false }, reward: 'GAINS', beta: false },
    { id: 'watersort', category: 'PUZZLE', name: 'NEON MIX', icon: CustomNeonMixIcon, color: 'text-pink-400', bg: 'bg-pink-900/20', border: 'border-pink-500/30', hoverBorder: 'hover:border-pink-400', shadow: 'hover:shadow-[0_0_20px_rgba(244,114,182,0.3)]', glow: 'rgba(244,114,182,0.8)', badges: { solo: true, online: false, vs: false, new: false }, reward: 'GAINS', beta: false },
    { id: 'checkers', category: 'STRATEGY', name: 'DAMES', icon: CustomCheckersIcon, color: 'text-teal-400', bg: 'bg-teal-900/20', border: 'border-teal-500/30', hoverBorder: 'hover:border-teal-400', shadow: 'hover:shadow-[0_0_20px_rgba(45,212,191,0.3)]', glow: 'rgba(45,212,191,0.8)', badges: { solo: true, online: true, vs: true, new: false }, reward: 'GAINS', beta: false },
    { id: 'uno', category: 'STRATEGY', name: 'UNO', icon: CustomUnoIcon, color: 'text-red-500', bg: 'bg-red-900/20', border: 'border-red-500/30', hoverBorder: 'hover:border-red-500', shadow: 'hover:shadow-[0_0_20px_rgba(239,68,68,0.3)]', glow: 'rgba(239,68,68,0.8)', badges: { solo: true, online: true, vs: false, new: false }, reward: 'GAINS', beta: false },
    { id: 'snake', category: 'ARCADE', name: 'SNAKE', icon: CustomUltraSnakeIcon, color: 'text-green-500', bg: 'bg-green-900/20', border: 'border-green-500/30', hoverBorder: 'hover:border-green-500', shadow: 'hover:shadow-[0_0_20px_rgba(34,197,94,0.3)]', glow: 'rgba(34,197,94,0.8)', badges: { solo: true, online: false, vs: false, new: false }, reward: 'GAINS', beta: false },
    { id: 'invaders', category: 'ARCADE', name: 'INVADERS', icon: CustomUltraInvadersIcon, color: 'text-rose-500', bg: 'bg-rose-900/20', border: 'border-rose-500/30', hoverBorder: 'hover:border-rose-500', shadow: 'hover:shadow-[0_0_20px_rgba(244,63,94,0.3)]', glow: 'rgba(244,63,94,0.8)', badges: { solo: true, online: false, vs: false, new: false }, reward: 'GAINS', beta: false },
    { id: 'breaker', category: 'ARCADE', name: 'BREAKER', icon: CustomUltraBreakerIcon, color: 'text-fuchsia-500', bg: 'bg-fuchsia-900/20', border: 'border-fuchsia-500/30', hoverBorder: 'hover:border-fuchsia-500', shadow: 'hover:shadow-[0_0_20px_rgba(217,70,239,0.3)]', glow: 'rgba(217,70,239,0.8)', badges: { solo: true, online: false, vs: false, new: false }, reward: 'GAINS', beta: false },
    { id: 'pacman', category: 'ARCADE', name: 'PACMAN', icon: CustomUltraPacmanIcon, color: 'text-yellow-400', bg: 'bg-yellow-900/20', border: 'border-yellow-500/30', hoverBorder: 'hover:border-yellow-400', shadow: 'hover:shadow-[0_0_20px_rgba(250,204,21,0.3)]', glow: 'rgba(250,204,21,0.8)', badges: { solo: true, online: false, vs: false, new: false }, reward: 'GAINS', beta: false },
    { id: 'airhockey', category: 'ARCADE', name: 'AIR HOCKEY', icon: CustomAirHockeyIcon, color: 'text-sky-400', bg: 'bg-sky-900/20', border: 'border-sky-500/30', hoverBorder: 'hover:border-sky-400', shadow: 'hover:shadow-[0_0_20px_rgba(56,189,248,0.3)]', glow: 'rgba(56,189,248,0.8)', badges: { solo: true, online: true, vs: true, new: false }, reward: 'GAINS', beta: false },
    { id: 'sudoku', category: 'PUZZLE', name: 'SUDOKU', icon: CustomUltraSudokuIcon, color: 'text-sky-400', bg: 'bg-sky-900/20', border: 'border-sky-500/30', hoverBorder: 'hover:border-sky-400', shadow: 'hover:shadow-[0_0_20px_rgba(56,189,248,0.3)]', glow: 'rgba(56,189,248,0.8)', badges: { solo: true, online: false, vs: false, new: false }, reward: '50', beta: false },
    { id: 'mastermind', category: 'PUZZLE', name: 'MASTERMIND', icon: CustomUltraMastermindIcon, color: 'text-indigo-400', bg: 'bg-indigo-900/20', border: 'border-indigo-500/30', hoverBorder: 'hover:border-indigo-400', shadow: 'hover:shadow-[0_0_20px_rgba(129,140,248,0.3)]', glow: 'rgba(129,140,248,0.8)', badges: { solo: true, online: true, vs: false, new: false }, reward: 'GAINS', beta: false },
    { id: 'connect4', category: 'STRATEGY', name: 'CONNECT 4', icon: CustomUltraConnect4Icon, color: 'text-pink-500', bg: 'bg-pink-900/20', border: 'border-pink-500/30', hoverBorder: 'hover:border-pink-500', shadow: 'hover:shadow-[0_0_20px_rgba(236,72,153,0.3)]', glow: 'rgba(236,72,153,0.8)', badges: { solo: true, online: true, vs: true, new: false }, reward: '30', beta: false },
    { id: 'memory', category: 'PUZZLE', name: 'MEMORY', icon: CustomUltraMemoryIcon, color: 'text-violet-400', bg: 'bg-violet-900/20', border: 'border-violet-500/30', hoverBorder: 'hover:border-violet-400', shadow: 'hover:shadow-[0_0_20px_rgba(167,139,250,0.3)]', glow: 'rgba(167,139,250,0.8)', badges: { solo: true, online: true, vs: false, new: false }, reward: 'GAINS', beta: false },
    { id: 'battleship', category: 'STRATEGY', name: 'BATAILLE', icon: CustomBattleshipIcon, color: 'text-blue-500', bg: 'bg-blue-900/20', border: 'border-blue-500/30', hoverBorder: 'hover:border-blue-500', shadow: 'hover:shadow-[0_0_20px_rgba(59,130,246,0.3)]', glow: 'rgba(59,130,246,0.8)', badges: { solo: true, online: true, vs: false, new: false }, reward: 'GAINS', beta: false },
];

export const CATEGORIES = [
    { id: 'ALL', label: 'TOUT', icon: LayoutGrid },
    { id: 'ONLINE', label: 'EN LIGNE', icon: Globe },
    { id: 'ARCADE', label: 'ARCADE', icon: Gamepad2 },
    { id: 'PUZZLE', label: 'RÉFLEXION', icon: Puzzle },
    { id: 'STRATEGY', label: 'STRATÉGIE', icon: Trophy },
];

export const LEADERBOARD_GAMES = [
    { id: 'slither', label: 'SERPENT', unit: 'pts', type: 'high', color: 'text-indigo-400' },
    { id: 'lumen', label: 'LUMEN', unit: 'pts', type: 'high', color: 'text-cyan-400' },
    { id: 'arenaclash', label: 'ARENA', unit: '', type: 'high', color: 'text-red-500' },
    { id: 'skyjo', label: 'SKYJO', unit: 'pts', type: 'low', color: 'text-purple-400' },
    { id: 'stack', label: 'STACK', unit: '', type: 'high', color: 'text-indigo-400' },
    { id: 'tetris', label: 'TETRIS', unit: '', type: 'high', color: 'text-neon-blue' },
    { id: 'runner', label: 'RUNNER', unit: '', type: 'high', color: 'text-orange-400' },
    { id: 'snake', label: 'SNAKE', unit: '', type: 'high', color: 'text-green-500' },
    { id: 'pacman', label: 'PACMAN', unit: '', type: 'high', color: 'text-yellow-400' },
    { id: 'breaker', label: 'BREAKER', unit: '', type: 'high', color: 'text-fuchsia-500' },
    { id: 'invaders', label: 'INVADERS', unit: '', type: 'high', color: 'text-rose-500' },
    { id: 'uno', label: 'UNO', unit: 'pts', type: 'high', color: 'text-red-500' },
    { id: 'watersort', label: 'NEON MIX', unit: 'Niv', type: 'high', color: 'text-pink-400' },
    { id: 'memory', label: 'MEMORY', unit: 'cps', type: 'low', color: 'text-violet-400' },
    { id: 'mastermind', label: 'NEON MIND', unit: 'cps', type: 'low', color: 'text-indigo-400' },
];