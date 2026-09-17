import React, { useState, useMemo } from 'react';
import { useAppData } from '../context/AppDataContext';
import { Vehicle, StockStatus, VehicleCategory, FuelType } from '../types/database.types';
import { StatusBadge } from '../components/common/StatusBadge';
import { VehicleFormModal } from '../components/vehicles/VehicleFormModal';
import { VehicleDetailModal } from '../components/vehicles/VehicleDetailModal';
import { formatINR } from '../lib/formatters';
import {
  Bike,
  Plus,
  Search,
  Filter,
  Eye,
  Edit2,
  FileSpreadsheet,
  Zap,
} from 'lucide-react';

export const VehiclesPage: React.FC = () => {
  const { vehicles } = useAppData();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedFuel, setSelectedFuel] = useState<string>('ALL');

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [detailVehicle, setDetailVehicle] = useState<Vehicle | null>(null);

  // Filtered vehicles
  const filteredVehicles = useMemo(() => {
    return vehicles.filter(v => {
      // Search matches Brand, Model, VIN, Engine, Motor, Colour
      const term = searchTerm.toLowerCase().trim();
      const matchSearch =
        !term ||
        v.brand.toLowerCase().includes(term) ||
        v.model.toLowerCase().includes(term) ||
        v.variant.toLowerCase().includes(term) ||
        v.vin_chassis.toLowerCase().includes(term) ||
        (v.engine_number && v.engine_number.toLowerCase().includes(term)) ||
        (v.motor_number && v.motor_number.toLowerCase().includes(term)) ||
        v.colour.toLowerCase().includes(term);

      const matchStatus = selectedStatus === 'ALL' || v.stock_status === selectedStatus;
      const matchCategory = selectedCategory === 'ALL' || v.category === selectedCategory;
      const matchFuel = selectedFuel === 'ALL' || v.fuel_type === selectedFuel;

      return matchSearch && matchStatus && matchCategory && matchFuel;
    });
  }, [vehicles, searchTerm, selectedStatus, selectedCategory, selectedFuel]);

  const handleEdit = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    setSelectedVehicle(null);
    setIsFormOpen(true);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Vehicle Inventory</h2>
          <p className="text-xs text-slate-500">
            Unit-level stock tracking. Each unit is uniquely identified by its VIN/Chassis number.
          </p>
        </div>

        <button
          onClick={handleAddNew}
          className="flex items-center space-x-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Vehicle</span>
        </button>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search bar */}
          <div className="md:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by Brand, Model, Chassis / VIN, Engine, Motor..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
          </div>

          {/* Status filter */}
          <div className="md:col-span-2">
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
            >
              <option value="ALL">All Statuses</option>
              <option value="IN_STOCK">IN STOCK</option>
              <option value="BOOKED">BOOKED</option>
              <option value="SOLD">SOLD</option>
              <option value="DELIVERED">DELIVERED</option>
            </select>
          </div>

          {/* Category filter */}
          <div className="md:col-span-2">
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
            >
              <option value="ALL">All Categories</option>
              <option value="Motorcycle">Motorcycle</option>
              <option value="Scooter">Scooter</option>
              <option value="Electric Motorcycle">Electric Motorcycle</option>
              <option value="Electric Scooter">Electric Scooter</option>
            </select>
          </div>

          {/* Fuel filter */}
          <div className="md:col-span-2">
            <select
              value={selectedFuel}
              onChange={e => setSelectedFuel(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
            >
              <option value="ALL">All Fuel Types</option>
              <option value="Petrol">Petrol</option>
              <option value="Electric">Electric</option>
            </select>
          </div>
        </div>

        {/* Quick count indicator */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
          <span>Showing {filteredVehicles.length} of {vehicles.length} physical units</span>
          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>In Stock: {vehicles.filter(v => v.stock_status === 'IN_STOCK').length}</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              <span>Booked: {vehicles.filter(v => v.stock_status === 'BOOKED').length}</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-slate-400"></span>
              <span>Sold: {vehicles.filter(v => v.stock_status === 'SOLD').length}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Vehicle Inventory Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredVehicles.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs animate-fade-in">
            <Bike className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="font-semibold text-slate-600 text-sm">No vehicles match your inventory</p>
            <p className="mt-1 text-slate-400 mb-4">Register new two-wheelers or electric vehicles with unique Chassis/VIN.</p>
            <button
              onClick={handleAddNew}
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-xs transition-colors btn-interactive"
            >
              <Plus className="w-4 h-4" />
              <span>Add Vehicle</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3">Vehicle Details</th>
                  <th className="px-5 py-3">Chassis / VIN Number</th>
                  <th className="px-5 py-3">Engine / Motor No.</th>
                  <th className="px-5 py-3">HSN & Tax Rate</th>
                  <th className="px-5 py-3 text-right">Selling Price</th>
                  <th className="px-5 py-3 text-center">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredVehicles.map(veh => (
                  <tr key={veh.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Vehicle Details */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-start space-x-2.5">
                        <div className={`p-2 rounded-lg mt-0.5 ${veh.fuel_type === 'Electric' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                          {veh.fuel_type === 'Electric' ? <Zap className="w-4 h-4" /> : <Bike className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-xs">
                            {veh.brand} {veh.model}
                          </p>
                          <p className="text-[11px] text-slate-600">
                            {veh.variant} &bull; <span className="font-medium">{veh.colour}</span>
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {veh.category} &bull; Mfg: {veh.mfg_year}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* VIN / Chassis */}
                    <td className="px-5 py-3.5 font-mono font-bold text-slate-950 text-xs tracking-wider">
                      {veh.vin_chassis}
                    </td>

                    {/* Engine / Motor */}
                    <td className="px-5 py-3.5 font-mono text-slate-700 text-xs">
                      {veh.fuel_type === 'Electric' ? veh.motor_number || '-' : veh.engine_number || '-'}
                    </td>

                    {/* HSN & Tax */}
                    <td className="px-5 py-3.5">
                      <p className="font-mono font-semibold text-slate-900">{veh.hsn_code}</p>
                      <p className="text-[11px] text-slate-500">
                        {veh.default_gst_rate}% GST{veh.default_cess_rate > 0 ? ` + ${veh.default_cess_rate}% Cess` : ''}
                      </p>
                    </td>

                    {/* Price */}
                    <td className="px-5 py-3.5 text-right font-mono font-bold text-slate-950 text-xs">
                      {formatINR(veh.default_selling_price)}
                    </td>

                    {/* Status */}
                    <td className="px-5 py-3.5 text-center">
                      <StatusBadge status={veh.stock_status} size="sm" />
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => setDetailVehicle(veh)}
                          title="View Specifications"
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {veh.stock_status !== 'SOLD' && (
                          <button
                            onClick={() => handleEdit(veh)}
                            title="Edit Vehicle"
                            className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <VehicleFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        initialVehicle={selectedVehicle}
      />

      <VehicleDetailModal
        vehicle={detailVehicle}
        onClose={() => setDetailVehicle(null)}
        onEdit={handleEdit}
      />
    </div>
  );
};
