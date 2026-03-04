class LocationCache {
    private countries: Map<string, { id: string; name: string }> = new Map();
    private cities: Map<string, { id: string; name: string }> = new Map();
    private loadingPromises: Map<string, Promise<any>> = new Map();

    getCountry(id: string): { id: string; name: string } | undefined {
        return this.countries.get(id);
    }

    getCity(id: string): { id: string; name: string } | undefined {
        return this.cities.get(id);
    }

    async loadCountries(): Promise<{ id: string; name: string }[]> {
        const cacheKey = 'countries';
        
        if (this.loadingPromises.has(cacheKey)) {
            return this.loadingPromises.get(cacheKey);
        }

        const promise = this._loadCountries();
        this.loadingPromises.set(cacheKey, promise);
        
        try {
            const countries = await promise;
            return countries;
        } finally {
            this.loadingPromises.delete(cacheKey);
        }
    }

    async loadCitiesByCountry(countryId: string): Promise<{ id: string; name: string }[]> {
        const cacheKey = `cities_${countryId}`;
        
        if (this.loadingPromises.has(cacheKey)) {
            return this.loadingPromises.get(cacheKey);
        }

        const promise = this._loadCitiesByCountry(countryId);
        this.loadingPromises.set(cacheKey, promise);
        
        try {
            const cities = await promise;
            return cities;
        } finally {
            this.loadingPromises.delete(cacheKey);
        }
    }

    async loadAllLocations(): Promise<{
        countries: { id: string; name: string }[];
        cities: { id: string; name: string }[];
    }> {
        const cacheKey = 'all_locations';
        
        if (this.loadingPromises.has(cacheKey)) {
            return this.loadingPromises.get(cacheKey);
        }

        const promise = this._loadAllLocations();
        this.loadingPromises.set(cacheKey, promise);
        
        try {
            const result = await promise;
            return result;
        } finally {
            this.loadingPromises.delete(cacheKey);
        }
    }

    isLoaded(): boolean {
        return this.countries.size > 0 || this.cities.size > 0;
    }

    private async _loadCountries(): Promise<{ id: string; name: string }[]> {
        if (this.countries.size > 0) {
            return Array.from(this.countries.values());
        }

        const { getCountries } = await import('@/shared/api/locations');
        const countries = await getCountries();
        
        countries.forEach(country => {
            this.countries.set(country.id, { id: country.id, name: country.name });
        });

        return Array.from(this.countries.values());
    }

    private async _loadCitiesByCountry(countryId: string): Promise<{ id: string; name: string }[]> {
        const { getCitiesByCountry } = await import('@/shared/api/locations');
        const cities = await getCitiesByCountry(countryId);
        
        cities.forEach(city => {
            this.cities.set(city.id, { id: city.id, name: city.name });
        });

        return cities.map(city => ({ id: city.id, name: city.name }));
    }

    private async _loadAllLocations(): Promise<{
        countries: { id: string; name: string }[];
        cities: { id: string; name: string }[];
    }> {
        const { getCountries, getCitiesByBusiness } = await import('@/shared/api/locations');
        
        const countries = await getCountries();
        countries.forEach(country => {
            this.countries.set(country.id, { id: country.id, name: country.name });
        });

        let cities: any[] = [];
        try {
            const { getCurrentBusiness } = await import('@/shared/api/business');
            const business = await getCurrentBusiness();
            cities = await getCitiesByBusiness(business.id);
        } catch (error) {
            console.warn('Не удалось загрузить города через бизнес API, используем альтернативный метод');
            const cityPromises = countries.map(country => 
                this._loadCitiesByCountry(country.id).catch(() => [])
            );
            const cityArrays = await Promise.all(cityPromises);
            cities = cityArrays.flat();
        }

        cities.forEach(city => {
            this.cities.set(city.id, { id: city.id, name: city.name });
        });

        return {
            countries: Array.from(this.countries.values()),
            cities: Array.from(this.cities.values())
        };
    }

    clear(): void {
        this.countries.clear();
        this.cities.clear();
        this.loadingPromises.clear();
    }

    getAllCountries(): { id: string; name: string }[] {
        return Array.from(this.countries.values());
    }

    getAllCities(): { id: string; name: string }[] {
        return Array.from(this.cities.values());
    }

    getCitiesByCountry(countryId: string): { id: string; name: string }[] {
        return Array.from(this.cities.values()).filter(city => {
            return true;
        });
    }
}

export const locationCache = new LocationCache();
