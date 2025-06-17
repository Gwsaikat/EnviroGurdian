import { render, screen } from '@testing-library/react';
import { AQIDisplay } from '../aqi-display';

describe('AQIDisplay', () => {
  it('renders AQI value and level', () => {
    render(<AQIDisplay value={{ value: 120, level: 'Unhealthy', recommendation: 'Limit outdoor activities.' }} />);
    expect(screen.getByText(/AQI: 120/)).toBeInTheDocument();
    expect(screen.getByText(/Unhealthy/)).toBeInTheDocument();
  });
}); 