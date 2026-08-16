// src/components/patient/appointment-details/PrescriptionAndDocuments.jsx

import React from 'react';
import Loader from '../../ui/Loader';
import { FileCheck, FileText, Upload, Trash2, Pill } from 'lucide-react';

export default function PrescriptionAndDocuments({ 
  prescription, 
  rawPrescriptionString,
  documents, 
  loading, 
  uploadingDoc, 
  onDocumentUpload, 
  onDocumentDelete 
}) {
  let parsedPrescriptionList = [];
  if (rawPrescriptionString && typeof rawPrescriptionString === 'string') {
    try {
      parsedPrescriptionList = JSON.parse(rawPrescriptionString);
    } catch (e) {
      parsedPrescriptionList = [];
    }
  }

  return (
    <div className="space-y-6">
      {/* Prescriptions Section */}
      <div className="space-y-3 pt-2">
        <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider block flex items-center gap-1.5">
          <FileCheck className="w-4 h-4 text-brand-600" /> Doctor Prescriptions
        </span>

        {parsedPrescriptionList.length > 0 ? (
          <div className="grid grid-cols-1 gap-2.5">
            {parsedPrescriptionList.map((med, idx) => (
              <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-start gap-3">
                <div className="p-2 bg-brand-50 text-brand-600 rounded-lg">
                  <Pill className="w-4 h-4" />
                </div>
                <div className="space-y-0.5 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-slate-900 text-sm">{med.drug}</span>
                    <span className="text-[10px] font-bold bg-slate-200/80 px-2 py-0.5 rounded text-slate-700">Qty: {med.qty}</span>
                  </div>
                  <p className="text-slate-600 font-medium"><strong>Timing:</strong> {med.timing}</p>
                  {med.notes && <p className="text-slate-400 italic mt-0.5">{med.notes}</p>}
                </div>
              </div>
            ))}
          </div>
        ) : prescription ? (
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5 text-xs">
            <p className="font-bold text-slate-900 text-sm">{prescription.title || "Consultation Prescription"}</p>
            <p className="text-slate-600 leading-relaxed">{prescription.details || prescription.notes || "Follow dosage instructions."}</p>
          </div>
        ) : (
          <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-slate-400 text-xs italic">
            No prescriptions provided for this consultation yet.
          </div>
        )}
      </div>

      {/* Uploaded Documents List */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
            Attached Medical Documents ({documents.length})
          </span>
          <label className={`flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-lg cursor-pointer transition-colors ${uploadingDoc ? 'opacity-50 pointer-events-none' : ''}`}>
            <Upload className="w-3.5 h-3.5" /> Upload File
            <input type="file" accept=".pdf,.docx,image/*" className="hidden" onChange={onDocumentUpload} />
          </label>
        </div>

        {loading ? <Loader /> : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {documents.map((doc) => (
              <div key={doc.id} className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 truncate">
                  <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <a 
                    href={doc.file_url || doc.url || doc.document_url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-xs font-bold text-slate-700 hover:text-brand-600 truncate underline"
                  >
                    {doc.file_name || doc.document_name || `Document #${doc.id}`}
                  </a>
                </div>
                <button onClick={() => onDocumentDelete(doc.id)} className="text-slate-400 hover:text-rose-600 p-1">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}

            {documents.length === 0 && (
              <div className="col-span-full p-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-slate-400 text-xs italic">
                No supporting documents uploaded for this appointment.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}