'use client';

/**
 * /admin/pipeline/factory — Product Factory Dashboard
 * 
 * 7-Stage House-Building Lifecycle View
 * 
 * Shows the entire portfolio through the "building a house" analogy:
 * - Stage 1: Pre-Development (site survey, permits)
 * - Stage 2: Design & Planning (architect's work)
 * - Stage 3: Compliance & Standards (NCC/assessors)
 * - Stage 4: Construction (builder's work)
 * - Stage 5: Certification & Sign-off (certifier)
 * - Stage 6: Handover & Launch (settlement)
 * - Stage 7: Operations & Maintenance (post-occupancy)
 * 
 * Also shows:
 * - Certificate of Occupancy status
 * - Smart Sensors (Health/Security/Cost)
 */

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Building, 
  FileCheck, 
  Shield, 
  Wrench, 
  Key, 
  Home,
  Activity,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';

interface StageProduct {
  slug: string;
  display_name: string;
  category: string;
  current_stage: number;
  stage_name: string;
  readiness_score: number;
  certificate: {
    status: 'valid' | 'expired' | 'missing' | 'pending_review' | 'issues_reported';
    valid_until?: string;
  };
  sensors: {
    health: 'ok' | 'warning' | 'down';
    security: 'ok' | 'warning';
    cost: 'ok' | 'warning' | 'over_budget';
  };
}

const STAGES = [
  { id: 1, name: 'Pre-Development', icon: Building, color: 'bg-slate-500', desc: 'Site survey, permits, feasibility' },
  { id: 2, name: 'Design & Planning', icon: FileCheck, color: 'bg-blue-500', desc: 'Architect plans, Q7 classification' },
  { id: 3, name: 'Compliance & Standards', icon: Shield, color: 'bg-purple-500', desc: 'NCC checks, automated gates' },
  { id: 4, name: 'Construction', icon: Wrench, color: 'bg-orange-500', desc: 'Implementation, coding' },
  { id: 5, name: 'Certification & Sign-off', icon: Key, color: 'bg-yellow-500', desc: 'Trade certs, CoO issuance' },
  { id: 6, name: 'Handover & Launch', icon: Home, color: 'bg-green-500', desc: 'Deploy, handover package' },
  { id: 7, name: 'Operations & Maintenance', icon: Activity, color: 'bg-teal-500', desc: 'Smart Sensors, SayFix' },
];

export default function ProductFactoryDashboard() {
  const [products, setProducts] = useState<StageProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStage, setSelectedStage] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/admin/pipeline/scan');
        const data = await res.json();
        
        // Transform portfolio data into stage-based structure
        const transformed: StageProduct[] = data.portfolio.map((p: any) => ({
          slug: p.manifest.name,
          display_name: p.validation?.display_name || p.manifest.name,
          category: p.manifest.category || 'product',
          current_stage: p.current_stage || 0,
          stage_name: p.stage_name || 'Not Started',
          readiness_score: p.readiness_score || 0,
          certificate: p.certificate_of_occupancy || { status: 'missing' },
          sensors: p.smart_sensors || { health: 'down', security: 'ok', cost: 'ok' },
        }));
        
        setProducts(transformed);
      } catch (e) {
        console.error('Failed to fetch:', e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const productsByStage = STAGES.map(stage => ({
    ...stage,
    products: products.filter(p => p.current_stage === stage.id)
  }));

  const notStarted = products.filter(p => p.current_stage === 0);
  
  // Stats
  const totalProducts = products.length;
  const certifiedProducts = products.filter(p => p.certificate.status === 'valid').length;
  const sensorsOk = products.filter(p => 
    p.sensors.health === 'ok' && p.sensors.security === 'ok' && p.sensors.cost === 'ok'
  ).length;
  const sensorsWarning = products.filter(p => 
    p.sensors.health === 'warning' || p.sensors.security === 'warning' || p.sensors.cost === 'warning'
  ).length;
  const sensorsDown = products.filter(p => p.sensors.health === 'down').length;

  const getCertIcon = (status: string) => {
    switch (status) {
      case 'valid': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'expired': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'issues_reported': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'pending_review': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      default: return <XCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getSensorDots = (sensors: StageProduct['sensors']) => {
    const dots = [];
    dots.push(sensors.health === 'ok' ? '🟢' : sensors.health === 'warning' ? '🟡' : '🔴');
    dots.push(sensors.security === 'ok' ? '🟢' : '🟡');
    dots.push(sensors.cost === 'ok' ? '🟢' : sensors.cost === 'warning' ? '🟡' : '🔴');
    return dots.join('');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Loading Product Factory...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Product Factory — 7-Stage Lifecycle</h1>
          <p className="text-gray-400">
            Portfolio view through the &quot;building a house&quot; analogy. 
            Certificate of Occupancy required for launch and ongoing operations.
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <p className="text-gray-400 text-sm">Total Products</p>
            <p className="text-2xl font-bold">{totalProducts}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <p className="text-gray-400 text-sm">Certified (CoO)</p>
            <p className="text-2xl font-bold text-green-400">{certifiedProducts}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <p className="text-gray-400 text-sm">Sensors OK</p>
            <p className="text-2xl font-bold text-green-400">{sensorsOk}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <p className="text-gray-400 text-sm">Needs Attention</p>
            <p className="text-2xl font-bold text-yellow-400">{sensorsWarning + sensorsDown}</p>
          </div>
        </div>

        {/* Not Started Products */}
        {notStarted.length > 0 && (
          <div className="mb-8 bg-gray-800 rounded-lg p-4 border border-gray-700">
            <h2 className="text-lg font-semibold mb-3 text-gray-300">Not Yet Started</h2>
            <div className="flex flex-wrap gap-2">
              {notStarted.map(p => (
                <Link
                  key={p.slug}
                  href={`/admin/pipeline/${p.slug}`}
                  className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-full text-sm"
                >
                  {p.display_name}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Stage Cards */}
        <div className="space-y-6">
          {productsByStage.map(stage => (
            <div 
              key={stage.id}
              className={`bg-gray-800 rounded-lg border border-gray-700 overflow-hidden ${
                selectedStage === stage.id ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              {/* Stage Header */}
              <button
                onClick={() => setSelectedStage(selectedStage === stage.id ? null : stage.id)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-750 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg ${stage.color} flex items-center justify-center`}>
                    <stage.icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-semibold">Stage {stage.id}</span>
                      <span className="text-gray-400">— {stage.name}</span>
                    </div>
                    <p className="text-sm text-gray-500">{stage.desc}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-2xl font-bold text-gray-600">{stage.products.length}</span>
                  <ChevronRight className={`w-5 h-5 text-gray-500 transition-transform ${
                    selectedStage === stage.id ? 'rotate-90' : ''
                  }`} />
                </div>
              </button>

              {/* Stage Products */}
              {selectedStage === stage.id && stage.products.length > 0 && (
                <div className="border-t border-gray-700">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-750 text-gray-400">
                      <tr>
                        <th className="px-4 py-3 text-left">Product</th>
                        <th className="px-4 py-3 text-center">Score</th>
                        <th className="px-4 py-3 text-center">Certificate</th>
                        <th className="px-4 py-3 text-center">Sensors</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stage.products.map(product => (
                        <tr key={product.slug} className="border-t border-gray-700 hover:bg-gray-750">
                          <td className="px-4 py-3">
                            <p className="font-medium">{product.display_name}</p>
                            <p className="text-xs text-gray-500">{product.slug}</p>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              product.readiness_score >= 80 ? 'bg-green-900 text-green-300' :
                              product.readiness_score >= 50 ? 'bg-yellow-900 text-yellow-300' :
                              'bg-gray-700 text-gray-400'
                            }`}>
                              {product.readiness_score}%
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-1" title={product.certificate.status}>
                              {getCertIcon(product.certificate.status)}
                              <span className="text-xs text-gray-400 capitalize">
                                {product.certificate.status.replace('_', ' ')}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="text-lg" title={`Health: ${product.sensors.health}, Security: ${product.sensors.security}, Cost: ${product.sensors.cost}`}>
                              {getSensorDots(product.sensors)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Link
                              href={`/admin/pipeline/${product.slug}`}
                              className="text-blue-400 hover:text-blue-300 text-sm"
                            >
                              Details →
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {selectedStage === stage.id && stage.products.length === 0 && (
                <div className="border-t border-gray-700 p-4 text-center text-gray-500">
                  No products in this stage
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            href="/admin/pipeline"
            className="bg-gray-800 hover:bg-gray-700 rounded-lg p-4 border border-gray-700 text-center transition-colors"
          >
            <p className="font-medium">← Back to Pipeline</p>
            <p className="text-sm text-gray-500">Original view</p>
          </Link>
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 text-center opacity-50">
            <p className="font-medium">Run Certification</p>
            <p className="text-sm text-gray-500">Stage 5 → CoO</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 text-center opacity-50">
            <p className="font-medium">Generate Handover</p>
            <p className="text-sm text-gray-500">Stage 6 package</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 text-center opacity-50">
            <p className="font-medium">Run Smart Sensors</p>
            <p className="text-sm text-gray-500">Stage 7 monitoring</p>
          </div>
        </div>
      </div>
    </div>
  );
}
