import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Downloads a prescription as PDF (excluding buttons and print-hidden elements)
 * @param elementId - The ID of the HTML element containing the prescription
 * @param filename - Optional filename for the PDF (default: "prescription.pdf")
 */
export const downloadPrescriptionAsPDF = async (
  elementId: string,
  filename: string = 'prescription.pdf'
): Promise<void> => {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error('Prescription element not found');
    }

    // Create a clone of the element to avoid affecting the original
    const clonedElement = element.cloneNode(true) as HTMLElement;
    
    // Remove all buttons from the clone (including close buttons, download buttons, etc.)
    const buttons = clonedElement.querySelectorAll('button');
    buttons.forEach(btn => btn.remove());
    
    // Remove elements with print:hidden class (buttons container)
    const printHiddenElements = clonedElement.querySelectorAll('.print\\:hidden, [class*="print:hidden"]');
    printHiddenElements.forEach(el => el.remove());
    
    // Remove the buttons container by ID if it exists
    const buttonsContainer = clonedElement.querySelector('#prescription-buttons, #prescription-buttons-doctor');
    if (buttonsContainer) {
      buttonsContainer.remove();
    }
    
    // Remove any div that contains only buttons (cleanup empty button containers)
    const allDivs = clonedElement.querySelectorAll('div');
    allDivs.forEach(div => {
      const children = Array.from(div.children);
      if (children.length > 0 && children.every(child => child.tagName === 'BUTTON')) {
        div.remove();
      }
    });

    // Set styles for the clone
    clonedElement.style.position = 'absolute';
    clonedElement.style.left = '-9999px';
    clonedElement.style.top = '0';
    clonedElement.style.width = element.offsetWidth + 'px';
    clonedElement.style.backgroundColor = '#ffffff';
    clonedElement.style.padding = '20px';
    
    document.body.appendChild(clonedElement);

    // Convert to canvas
    const canvas = await html2canvas(clonedElement, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      removeContainer: false,
    });

    // Remove the clone
    document.body.removeChild(clonedElement);

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
    const imgX = (pdfWidth - imgWidth * ratio) / 2;
    const imgY = 0;

    pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
    pdf.save(filename);
  } catch (error) {
    console.error('Error downloading prescription:', error);
    throw error;
  }
};

