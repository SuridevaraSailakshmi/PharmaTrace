import { forwardRef } from 'react';

interface LabelRendererProps {
  prc: string;
  qrSvg: string;
  payloadData: Record<string, string | number | undefined>;
}

export const LabelRenderer = forwardRef<HTMLDivElement, LabelRendererProps>(
  ({ prc, qrSvg, payloadData }, ref) => {
    return (
      <div 
        ref={ref}
        className="bg-white text-black p-6 font-sans relative"
        style={{ boxSizing: 'border-box', border: '3px solid black', width: '800px', margin: '0 auto' }}
      >
        <div className="flex justify-between items-start">
          {/* Left Column */}
          <div className="w-[65%] text-[15px] font-medium leading-relaxed">
            <div className="grid grid-cols-[160px_1fr] gap-x-2 mb-1">
              <span className="font-semibold text-gray-800">Product Name</span>
              <span>: {payloadData.product_name || ''}</span>
            </div>
            <div className="grid grid-cols-[160px_1fr] gap-x-2 mb-1">
              <span className="font-semibold text-gray-800">Batch No.</span>
              <span>: {payloadData.batch_no || ''}</span>
            </div>
            <div className="grid grid-cols-[160px_1fr] gap-x-2 mb-1">
              <span className="font-semibold text-gray-800">License No.</span>
              <span>: {payloadData.license_no || ''}</span>
            </div>
            <div className="grid grid-cols-[160px_1fr] gap-x-2 mb-1">
              <span className="font-semibold text-gray-800">CAS No.</span>
              <span>: {payloadData.cas_no || ''}</span>
            </div>
            <div className="grid grid-cols-[160px_1fr] gap-x-2 mb-1">
              <span className="font-semibold text-gray-800">Mfg. Date</span>
              <span>: {payloadData.mfg_date || ''}</span>
            </div>
            <div className="grid grid-cols-[160px_1fr] gap-x-2 mb-1">
              <span className="font-semibold text-gray-800">Re-test/Expiry Date</span>
              <span>: {payloadData.retest_expiry_date || payloadData.expiry_date || ''}</span>
            </div>
            <div className="grid grid-cols-[160px_1fr] gap-x-2 mb-1">
              <span className="font-semibold text-gray-800">Container No.</span>
              <span>: {payloadData.container_no || ''}</span>
            </div>
            <div className="grid grid-cols-[160px_1fr] gap-x-2 mb-1">
              <span className="font-semibold text-gray-800">Country of Origin</span>
              <span>: {payloadData.country_of_origin || ''}</span>
            </div>
            <div className="grid grid-cols-[160px_1fr] gap-x-2 mb-1">
              <span className="font-semibold text-gray-800">Storage</span>
              <span>: {payloadData.storage || ''}</span>
            </div>
            
            <div className="mt-4">
              <div className="grid grid-cols-[160px_1fr] gap-x-2 mb-1">
                <span className="font-semibold text-gray-800">Manufactured By</span>
                <span className="font-bold">: {payloadData.manufactured_by || ''}</span>
              </div>
              <div className="pl-[168px] text-[13px] text-gray-600 leading-snug">
                {payloadData.manufacturer_address || ''}
              </div>
            </div>


            <div className="mt-4 text-[13px] font-semibold">
              Product Reference Code: {prc}
            </div>
          </div>

          {/* Right Column */}
          <div className="w-[35%] flex flex-col items-end text-[15px] font-medium leading-relaxed">
            <div className="grid grid-cols-[110px_1fr] gap-x-2 mb-1 w-full text-right">
              <span className="font-semibold text-gray-800 text-left">Gross Weight</span>
              <span>: {payloadData.gross_weight || ''}</span>
            </div>
            <div className="grid grid-cols-[110px_1fr] gap-x-2 mb-1 w-full text-right">
              <span className="font-semibold text-gray-800 text-left">Tare Weight</span>
              <span>: {payloadData.tare_weight || ''}</span>
            </div>
            <div className="grid grid-cols-[110px_1fr] gap-x-2 mb-1 w-full text-right">
              <span className="font-semibold text-gray-800 text-left">Net Weight</span>
              <span>: {payloadData.net_weight || ''}</span>
            </div>

            <div className="mt-8 flex justify-end w-full">
              <div 
                className="w-48 h-48 bg-white"
                dangerouslySetInnerHTML={{ __html: qrSvg }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }
);
LabelRenderer.displayName = 'LabelRenderer';
