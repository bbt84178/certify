import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

export interface CertificateData {
  recipientName: string
  courseName: string
  issueDate: string
  issuerName: string
  description?: string
  template?: {
    background?: string
    logo?: string
    signatures?: string[]
    textElements?: any
  }
}

export const generateCertificatePDF = async (
  certificateData: CertificateData,
  certificateId: string
): Promise<string> => {
  try {
    // Create a temporary container for the certificate
    const container = document.createElement('div')
    container.style.position = 'absolute'
    container.style.left = '-9999px'
    container.style.width = '1200px'
    container.style.height = '900px'
    container.style.backgroundColor = '#ffffff'
    container.style.fontFamily = 'serif'
    
    // Build certificate HTML
    const certificateHTML = `
      <div style="
        width: 100%;
        height: 100%;
        position: relative;
        padding: 60px;
        box-sizing: border-box;
        background: ${certificateData.template?.background ? `url(${certificateData.template.background})` : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'};
        background-size: cover;
        background-position: center;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        text-align: center;
      ">
        ${certificateData.template?.logo ? `
          <img src="${certificateData.template.logo}" 
               style="position: absolute; top: 40px; left: 40px; height: 80px; width: auto;" />
        ` : ''}
        
        <div style="
          background: rgba(255, 255, 255, 0.95);
          padding: 80px 60px;
          border-radius: 20px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
          max-width: 800px;
          width: 100%;
        ">
          <h1 style="
            font-size: 48px;
            font-weight: bold;
            color: #2d3748;
            margin: 0 0 30px 0;
            font-family: serif;
          ">Certificate of Completion</h1>
          
          <p style="
            font-size: 24px;
            color: #4a5568;
            margin: 0 0 20px 0;
          ">This is to certify that</p>
          
          <h2 style="
            font-size: 56px;
            font-weight: bold;
            color: #2b6cb0;
            margin: 0 0 30px 0;
            font-family: serif;
          ">${certificateData.recipientName}</h2>
          
          <p style="
            font-size: 24px;
            color: #4a5568;
            margin: 0 0 20px 0;
          ">has successfully completed</p>
          
          <h3 style="
            font-size: 36px;
            font-weight: 600;
            color: #2d3748;
            margin: 0 0 40px 0;
            font-family: serif;
          ">${certificateData.courseName}</h3>
          
          ${certificateData.description ? `
            <p style="
              font-size: 18px;
              color: #718096;
              margin: 0 0 40px 0;
              line-height: 1.6;
              max-width: 600px;
              margin-left: auto;
              margin-right: auto;
            ">${certificateData.description}</p>
          ` : ''}
          
          <div style="
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 60px;
            padding-top: 40px;
            border-top: 2px solid #e2e8f0;
          ">
            <div style="text-align: left;">
              <p style="
                font-size: 18px;
                color: #4a5568;
                margin: 0 0 10px 0;
              ">Issue Date</p>
              <p style="
                font-size: 20px;
                font-weight: 600;
                color: #2d3748;
                margin: 0;
              ">${new Date(certificateData.issueDate).toLocaleDateString()}</p>
            </div>
            
            <div style="text-align: center;">
              <p style="
                font-size: 18px;
                color: #4a5568;
                margin: 0 0 10px 0;
              ">Issued by</p>
              <p style="
                font-size: 20px;
                font-weight: 600;
                color: #2d3748;
                margin: 0;
              ">${certificateData.issuerName}</p>
            </div>
            
            <div style="text-align: right;">
              <p style="
                font-size: 18px;
                color: #4a5568;
                margin: 0 0 10px 0;
              ">Certificate ID</p>
              <p style="
                font-size: 16px;
                font-weight: 600;
                color: #2d3748;
                margin: 0;
                font-family: monospace;
              ">${certificateId}</p>
            </div>
          </div>
          
          ${certificateData.template?.signatures && certificateData.template.signatures.length > 0 ? `
            <div style="
              display: flex;
              justify-content: space-around;
              margin-top: 40px;
              padding-top: 20px;
            ">
              ${certificateData.template.signatures.map((sig, index) => `
                <img src="${sig}" 
                     style="height: 60px; width: auto;" 
                     alt="Signature ${index + 1}" />
              `).join('')}
            </div>
          ` : ''}
        </div>
        
        <div style="
          position: absolute;
          bottom: 20px;
          right: 20px;
          font-size: 12px;
          color: #718096;
        ">
          Verified on blockchain • CertifyWeb3
        </div>
      </div>
    `
    
    container.innerHTML = certificateHTML
    document.body.appendChild(container)
    
    // Wait for images to load
    const images = container.querySelectorAll('img')
    await Promise.all(Array.from(images).map(img => {
      return new Promise((resolve) => {
        if (img.complete) {
          resolve(true)
        } else {
          img.onload = () => resolve(true)
          img.onerror = () => resolve(true)
        }
      })
    }))
    
    // Generate canvas from HTML
    const canvas = await html2canvas(container, {
      width: 1200,
      height: 900,
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff'
    })
    
    // Remove temporary container
    document.body.removeChild(container)
    
    // Create PDF
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'px',
      format: [1200, 900]
    })
    
    const imgData = canvas.toDataURL('image/png')
    pdf.addImage(imgData, 'PNG', 0, 0, 1200, 900)
    
    // Return base64 PDF data
    return pdf.output('datauristring')
  } catch (error) {
    console.error('PDF generation error:', error)
    throw new Error('Failed to generate PDF')
  }
}

export const downloadPDF = (pdfData: string, filename: string) => {
  const link = document.createElement('a')
  link.href = pdfData
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}