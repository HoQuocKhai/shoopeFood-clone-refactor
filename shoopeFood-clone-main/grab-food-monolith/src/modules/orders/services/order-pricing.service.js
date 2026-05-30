const { BadRequestError } = require('../../../common/errors');

class OrderPricingService {
  /**
   * Calculate order pricing from validated items.
   * subtotalAmount = sum of (unitPrice * quantity) for all items.
   * totalAmount = subtotalAmount + shippingFee + taxAmount - discountAmount (min 0).
   *
   * @param {Object} params
   * @param {Array<{unitPrice: number, quantity: number}>} params.items
   * @param {number} params.shippingFee
   * @param {number} [params.taxAmount=0]
   * @param {number} [params.discountAmount=0]
   * @returns {{subtotalAmount: number, shippingFee: number, taxAmount: number, discountAmount: number, totalAmount: number}}
   */
  calculate({ items, shippingFee, taxAmount = 0, discountAmount = 0 }) {
    if (!Array.isArray(items) || items.length === 0) {
      throw new BadRequestError('Order must contain at least one food item');
    }

    const subtotalAmount = items.reduce((sum, item) => {
      return sum + Number(item.unitPrice) * Number(item.quantity);
    }, 0);

    const totalAmount = Math.max(
      0,
      subtotalAmount + Number(shippingFee) + Number(taxAmount) - Number(discountAmount)
    );

    return {
      subtotalAmount,
      shippingFee: Number(shippingFee),
      taxAmount: Number(taxAmount),
      discountAmount: Number(discountAmount),
      totalAmount,
    };
  }
}

module.exports = new OrderPricingService();
