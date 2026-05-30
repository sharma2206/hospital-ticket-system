export function formatDate(value) {
    if (!value) return "-";
    return new Date(value).toLocaleDateString();
}

export function formatCurrency(amount) {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
    }).format(amount);
}
