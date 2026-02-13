const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const express = require("express");

let mainWindow;
let server;

function startServer() {
  const appServer = express();
  const distPath = path.join(__dirname, "../dist");
  appServer.use(express.static(distPath));
  appServer.use((req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
  return new Promise((resolve) => {
    server = appServer.listen(5179, () => {
      console.log("Servidor iniciado");
      resolve();
    });
  });
}

async function printTicket(data) {
  return new Promise((resolve, reject) => {
    const printWindow = new BrowserWindow({
      width: 350,  // ✅ Más ancho
      height: 700,
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true
      }
    });

    const ticketHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          @page { 
            size: 58mm 297mm; 
            margin: 0mm;
          }
          
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body { 
            width: 58mm; 
            font-family: 'Courier New', Courier, monospace;
            font-size: 11px;     /* ✅ Más grande */
            font-weight: 900;    /* ✅ Más negro */
            line-height: 1.3;
            padding: 2mm;
            margin: 0;
            color: #000000;
            background: #ffffff;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          
          .center { 
            text-align: center; 
          }
          
          .right { 
            text-align: right; 
          }
          
          .line { 
            border-top: 2px dashed #000000;  /* ✅ Más grueso */
            margin: 2mm 0; 
            height: 0;
          }
          
          h1 { 
            font-size: 20px;   /* ✅ Más grande */
            font-weight: 900;
            margin: 2mm 0;
            letter-spacing: 2px;
          }
          
          .subtitle {
            font-size: 12px;
            font-weight: 900;
            margin: 1mm 0;
          }
          
          .info {
            font-size: 10px;   /* ✅ Más grande */
            font-weight: 900;
            margin: 1mm 0;
          }
          
          .product { 
            margin: 2mm 0; 
          }
          
          .product-name {
            font-size: 10px;   /* ✅ Más grande */
            font-weight: 900;
          }
          
          .product-price {
            font-size: 11px;   /* ✅ Más grande */
            font-weight: 900;
            text-align: right;
            margin-top: 0.5mm;
          }
          
          .total {
            font-size: 22px;   /* ✅ Más grande */
            font-weight: 900;
            margin: 3mm 0;
            letter-spacing: 1px;
          }
          
          .payment {
            font-size: 10px;   /* ✅ Más grande */
            font-weight: 900;
            margin: 1mm 0;
          }
          
          .footer {
            font-size: 13px;   /* ✅ Más grande */
            font-weight: 900;
            margin-top: 5mm;
            letter-spacing: 2px;
          }
        </style>
      </head>
      <body>
        <div class="center">
          <h1>DYNATOS</h1>
          <div class="subtitle">MARKET & LICORERIA</div>
        </div>
        
        <div class="line"></div>
        
        <div class="info">FECHA: ${data.date}</div>
        <div class="info">FACT: ${data.sale_number || data.id}</div>
        <div class="info">CAJERO: ${data.cajero}</div>
        <div class="info">CLIENTE: ${data.customerName || 'GENERAL'}</div>
        ${data.customerDoc ? `<div class="info">DOC: ${data.customerDoc}</div>` : ''}
        
        <div class="line"></div>
        
        ${data.items.map(item => `
          <div class="product">
            <div class="product-name">${item.qty} x ${item.name.substring(0, 20)}</div>
            <div class="product-price">$${(item.qty * item.sale_price).toLocaleString()}</div>
          </div>
        `).join('')}
        
        <div class="line"></div>
        
        <div class="total right">
          TOTAL: $${Number(data.total).toLocaleString()}
        </div>
        
        <div class="line"></div>
        
        <div class="payment">METODO: ${data.method}</div>
        <div class="payment">RECIBIDO: $${Number(data.received).toLocaleString()}</div>
        <div class="payment">CAMBIO: $${Number(data.change).toLocaleString()}</div>
        
        <div class="footer center">
          *** GRACIAS ***
        </div>
        
        <div style="height: 20mm;"></div>
      </body>
      </html>
    `;

    printWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(ticketHTML));

    printWindow.webContents.on('did-finish-load', () => {
      setTimeout(() => {
        printWindow.webContents.print({
          silent: false,
          printBackground: true,
          color: false,
          margins: {
            marginType: 'none'
          },
          scaleFactor: 100  // ✅ Sin reducción de escala
        }, (success, errorType) => {
          if (!success) {
            console.error('Error:', errorType);
            reject(new Error(errorType));
          } else {
            console.log('Impreso correctamente');
            resolve({ ok: true });
          }
          
          setTimeout(() => {
            printWindow.close();
          }, 500);
        });
      }, 1000);
    });
  });
}

async function createWindow() {
  await startServer();

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    backgroundColor: "#000",
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      sandbox: false,
      devTools: false,
      preload: path.join(__dirname, "preload.js")
    }
  });

  mainWindow.loadURL("http://localhost:5179");

  ipcMain.handle("PRINT_TICKET", async (_, data) => {
    try {
      return await printTicket(data);
    } catch (error) {
      console.error("Error:", error);
      return { ok: false, error: error.message };
    }
  });
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (server) server.close();
  if (process.platform !== "darwin") app.quit();
});