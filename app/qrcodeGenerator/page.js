'use client';
import { useState, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import { Toaster, toast } from "react-hot-toast";

export default function QRGenerator() {
    const [qrProps, setQrProps] = useState({
        value: "Test Word",
        size: 180,
        level: "L",
        bgColor: "#ffffff",
        fgColor: "#000000",
        marginSize: 2,
        imageSettings: null,
    });

    const [loading, setLoading] = useState(false);
    const qrRef = useRef(null); // ref to container holding the SVG

    const handleChange = (field, value) => {
        setQrProps((prev) => ({ ...prev, [field]: value }));
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            handleChange("imageSettings", {
                src: reader.result,
                height: 40,
                width: 40,
                excavate: true,
            });
        };
        reader.readAsDataURL(file);
    };

    const copyQrValue = () => {
        navigator.clipboard.writeText(qrProps.value);
        toast.success("QR value copied!");
    };

    // Robust SVG -> PNG download
    const downloadQRCode = async () => {
        try {
            const container = qrRef.current;
            if (!container) {
                toast.error("QR element not found");
                return;
            }
            const svg = container.querySelector("svg");
            if (!svg) {
                toast.error("QR SVG not found");
                return;
            }

            // clone svg to avoid modifying original
            const clonedSvg = svg.cloneNode(true);

            // Ensure namespace
            if (!clonedSvg.getAttribute("xmlns")) {
                clonedSvg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
            }

            // Determine width/height
            let width = clonedSvg.getAttribute("width");
            let height = clonedSvg.getAttribute("height");

            // If no width/height attributes, try viewBox or fallback to size
            if ((!width || !height) && clonedSvg.getAttribute("viewBox")) {
                const vb = clonedSvg.getAttribute("viewBox").split(" ");
                if (vb.length === 4) {
                    width = width || vb[2];
                    height = height || vb[3];
                }
            }
            // fallback to qrProps.size if still missing
            width = parseInt(width || qrProps.size || 180, 10);
            height = parseInt(height || qrProps.size || 180, 10);

            clonedSvg.setAttribute("width", width);
            clonedSvg.setAttribute("height", height);

            // Serialize
            const svgData = new XMLSerializer().serializeToString(clonedSvg);
            const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
            const url = URL.createObjectURL(svgBlob);

            const img = new Image();
            img.crossOrigin = "anonymous";

            img.onload = () => {
                try {
                    const scale = window.devicePixelRatio || 1;
                    const canvas = document.createElement("canvas");
                    canvas.width = Math.round(width * scale);
                    canvas.height = Math.round(height * scale);
                    canvas.style.width = `${width}px`;
                    canvas.style.height = `${height}px`;

                    const ctx = canvas.getContext("2d");
                    // ensure sharp rendering on high-dpi screens
                    ctx.setTransform(scale, 0, 0, scale, 0, 0);
                    ctx.drawImage(img, 0, 0, width, height);

                    URL.revokeObjectURL(url);

                    // convert to blob and download
                    canvas.toBlob((blob) => {
                        if (!blob) {
                            toast.error("Failed to create image blob");
                            return;
                        }
                        const link = document.createElement("a");
                        const blobUrl = URL.createObjectURL(blob);
                        link.href = blobUrl;
                        link.download = `qrcode.png`;
                        document.body.appendChild(link);
                        link.click();
                        link.remove();
                        URL.revokeObjectURL(blobUrl);
                        toast.success("Downloaded QR image");
                    }, "image/png");
                } catch (err) {
                    URL.revokeObjectURL(url);
                    toast.error("Error converting SVG to PNG");
                    console.error(err);
                }
            };

            img.onerror = (err) => {
                URL.revokeObjectURL(url);
                toast.error("Failed to load SVG as image");
                console.error("img.onerror", err);
            };

            img.src = url;
        } catch (err) {
            console.error(err);
            toast.error("Download failed");
        }
    };

    return (
        <div className="login-container">
            <Toaster />
            <div className="future-card">
                <div className="main_div1">
                    <h1 className="title-neon" style={{ textAlign: "center" }}>
                        QR CODE GENERATOR
                    </h1>

                    <form
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            width: "100%",
                            gap: "18px",
                        }}
                    >
                        {/* QR VALUE */}
                        <label style={{ color: "#aaa", fontSize: "14px" }}>QR Value</label>
                        <div className="field-chrome" style={{ position: "relative", width: "100%" }}>
                            <div className="chrome-border" style={{ pointerEvents: "none" }}></div>
                            <input
                                type="text"
                                value={qrProps.value}
                                onChange={(e) => handleChange("value", e.target.value)}
                                placeholder="Enter URL or Text"
                                style={{
                                    width: "100%",
                                    color: "white",
                                    background: "transparent",
                                    border: "none",
                                    padding: "10px",
                                    zIndex: 2,
                                    position: "relative",
                                }}
                            />
                            <div className="field-hologram" style={{ pointerEvents: "none" }}></div>
                        </div>

                        {/* SIZE */}
                        <label style={{ color: "#aaa", fontSize: "14px" }}>Size (px)</label>
                        <div className="field-chrome" style={{ position: "relative", width: "100%" }}>
                            <div className="chrome-border" style={{ pointerEvents: "none" }}></div>
                            <input
                                type="number"
                                value={qrProps.size}
                                onChange={(e) => handleChange("size", Number(e.target.value))}
                                placeholder="180"
                                style={{
                                    width: "100%",
                                    color: "white",
                                    background: "transparent",
                                    border: "none",
                                    padding: "10px",
                                    zIndex: 2,
                                    position: "relative",
                                }}
                            />
                            <div className="field-hologram" style={{ pointerEvents: "none" }}></div>
                        </div>

                        {/* ERROR LEVEL */}
                        <label style={{ color: "#aaa", fontSize: "14px" }}>Error Level</label>
                        <div className="field-chrome" style={{ position: "relative", width: "100%" }}>
                            <div className="chrome-border" style={{ pointerEvents: "none" }}></div>
                            <TextField
                                select
                                variant="outlined"
                                value={qrProps.level}
                                onChange={(e) => handleChange("level", e.target.value)}
                                fullWidth
                                sx={{
                                    "& .MuiInputBase-root": { color: "white" },
                                    "& .MuiSvgIcon-root": { color: "white" },
                                }}
                            >
                                <MenuItem value="L">L (Low)</MenuItem>
                                <MenuItem value="M">M (Medium)</MenuItem>
                                <MenuItem value="Q">Q (Quartile)</MenuItem>
                                <MenuItem value="H">H (High)</MenuItem>
                            </TextField>
                            <div className="field-hologram" style={{ pointerEvents: "none" }}></div>
                        </div>

                        {/* COLORS */}
                        <label style={{ color: "#aaa", fontSize: "14px" }}>Colors</label>
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                                gap: "40px",
                                width: "100%",
                            }}
                        >
                            <div style={{ textAlign: "center" }}>
                                <label style={{ color: "#888", fontSize: "13px" }}>Foreground</label>
                                <input
                                    type="color"
                                    value={qrProps.fgColor}
                                    onChange={(e) => handleChange("fgColor", e.target.value)}
                                    style={{
                                        marginTop: "6px",
                                        width: "40px",
                                        height: "40px",
                                        border: "none",
                                        borderRadius: "6px",
                                        background: "transparent",
                                        cursor: "pointer",
                                    }}
                                />
                            </div>

                            <div style={{ textAlign: "center" }}>
                                <label style={{ color: "#888", fontSize: "13px" }}>Background</label>
                                <input
                                    type="color"
                                    value={qrProps.bgColor}
                                    onChange={(e) => handleChange("bgColor", e.target.value)}
                                    style={{
                                        marginTop: "6px",
                                        width: "40px",
                                        height: "40px",
                                        border: "none",
                                        borderRadius: "6px",
                                        background: "transparent",
                                        cursor: "pointer",
                                    }}
                                />
                            </div>
                        </div>

                        {/* MARGIN SIZE */}
                        <label style={{ color: "#aaa", fontSize: "14px" }}>Margin Size</label>
                        <div className="field-chrome" style={{ position: "relative", width: "100%" }}>
                            <div className="chrome-border" style={{ pointerEvents: "none" }}></div>
                            <input
                                type="number"
                                value={qrProps.marginSize}
                                onChange={(e) => handleChange("marginSize", Number(e.target.value))}
                                placeholder="4"
                                style={{
                                    width: "100%",
                                    color: "white",
                                    background: "transparent",
                                    border: "none",
                                    padding: "10px",
                                    zIndex: 2,
                                    position: "relative",
                                }}
                            />
                            <div className="field-hologram" style={{ pointerEvents: "none" }}></div>
                        </div>

                        {/* IMAGE UPLOAD */}
                        <label style={{ color: "#aaa", fontSize: "14px" }}>Center Image (optional)</label>
                        <div className="field-chrome" style={{ position: "relative", width: "100%" }}>
                            <div className="chrome-border" style={{ pointerEvents: "none" }}></div>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                style={{
                                    width: "100%",
                                    color: "white",
                                    background: "transparent",
                                    border: "none",
                                    padding: "10px",
                                    zIndex: 2,
                                    position: "relative",
                                }}
                            />
                            <div className="field-hologram" style={{ pointerEvents: "none" }}></div>
                        </div>

                        {/* PREVIEW IMAGE */}
                        {qrProps.imageSettings && (
                            <div style={{ marginTop: "10px" }}>
                                <img
                                    src={qrProps.imageSettings.src}
                                    alt="Preview"
                                    style={{
                                        width: 50,
                                        height: 50,
                                        borderRadius: "8px",
                                        border: "1px solid #333",
                                    }}
                                />
                            </div>
                        )}

                        {/* QR PREVIEW */}
                        <div style={{ margin: "30px auto" }} ref={qrRef}>
                            <QRCodeSVG
                                value={qrProps.value}
                                size={qrProps.size}
                                level={qrProps.level}
                                bgColor={qrProps.bgColor}
                                fgColor={qrProps.fgColor}
                                marginSize={qrProps.marginSize}
                                imageSettings={qrProps.imageSettings}
                            />
                        </div>

                        {/* BUTTONS */}
                        <Button
                            style={{
                                height: "45px",
                                color: "white",
                                width: "220px",
                                marginBottom: 8,
                            }}
                            onClick={copyQrValue}
                            disabled={loading}
                        >
                            <div className="button-chrome"></div>
                            <span className="button-text">{loading ? <CircularProgress size={20} /> : "COPY QR VALUE"}</span>
                            <div className="button-hologram"></div>
                        </Button>

                        <Button
                            style={{
                                height: "45px",
                                color: "white",
                                width: "220px",
                                marginBottom: 8,
                            }}
                            onClick={downloadQRCode}
                            disabled={loading}
                        >
                            <div className="button-chrome"></div>
                            <span className="button-text">{loading ? <CircularProgress size={20} /> : "DOWNLOAD QR IMAGE"}</span>
                            <div className="button-hologram"></div>
                        </Button>

                        <Button
                            style={{
                                height: "45px",
                                color: "white",
                                width: "220px",
                            }}
                            onClick={() => {
                                setQrProps({
                                    value: "",
                                    size: 200,
                                    level: "L",
                                    bgColor: "#ffffff",
                                    fgColor: "#000000",
                                    marginSize: 2,
                                    imageSettings: null,
                                });
                            }}
                            disabled={loading}
                        >
                            <div className="button-chrome"></div>
                            <span className="button-text">{loading ? <CircularProgress size={20} /> : "Reset"}</span>
                            <div className="button-hologram"></div>
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
}
