import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Checkbox } from '@/components/ui';

describe('Checkbox', () => {
  it('renders unchecked by default', () => {
    render(<Checkbox checked={false} />);
    const checkbox = screen.getByRole('button', { name: /checkbox/i });
    expect(checkbox).not.toHaveAttribute('aria-pressed', 'true');
  });

  it('renders checked when checked prop is true', () => {
    render(<Checkbox checked={true} />);
    const checkbox = screen.getByRole('button', { name: /checkbox/i });
    expect(checkbox).toHaveAttribute('aria-pressed', 'true');
  });

  it('calls onChange when clicked', () => {
    const handleChange = jest.fn();
    render(<Checkbox checked={false} onChange={handleChange} />);
    fireEvent.click(screen.getByRole('button'));
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it('applies custom size', () => {
    render(<Checkbox checked={false} size={24} />);
    const checkbox = screen.getByRole('button');
    expect(checkbox).toHaveStyle({ width: '24px', height: '24px' });
  });
});