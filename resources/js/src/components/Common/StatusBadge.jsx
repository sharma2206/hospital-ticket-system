const colors = {
    open:        'bg-yellow-100 text-yellow-800',
    in_progress: 'bg-blue-100 text-blue-800',
    resolved:    'bg-green-100 text-green-800',
    closed:      'bg-gray-100 text-gray-800',
    low:         'bg-gray-100 text-gray-700',
    medium:      'bg-orange-100 text-orange-700',
    high:        'bg-red-100 text-red-700',
    critical:    'bg-red-200 text-red-900 font-bold',
};

export default function StatusBadge({ value }) {
    return (
        <span className={`px-2 py-1 rounded text-xs ${colors[value] || 'bg-gray-100'}`}>
            {value?.replace('_', ' ').toUpperCase()}
        </span>
    );
}
