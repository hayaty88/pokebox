import { useEffect, useState, useRef, useCallback } from "react";
import "./App.css";
import { getPokemon } from "./utils/pokemon.js";
import Card from "./components/Card/Card.js";
import Navbar from "./components/Navbar/Navbar.js";
import CenterLoading from "./components/Loading/CenterLoading.js";
import Search from "./components/Search/Search.js";
import { useTranslation } from "react-i18next";

function App() {
  const { t, i18n } = useTranslation();
  const [page, setPage] = useState(1); // Update fetching Pokemon URL
  const [loading, setLoading] = useState(false);
  const [pageLang, setPageLang] = useState(i18n.language);
  const [centerLoading, setCenterLoading] = useState(true); // Center Loading
  const [pokemonData, setPokemonData] = useState([]); // Pokemon Data for displaying
  const [pokemonData2, setPokemonData2] = useState({ en: [], ja: [] }); // Pokemon Data for displaying
  const [query, setQuery] = useState(""); // Query for search Pokemon
  const pokemonTypes = [
    "bug",
    "dark",
    "dragon",
    "electric",
    "fairy",
    "fighting",
    "fire",
    "flying",
    "ghost",
    "grass",
    "ground",
    "ice",
    "normal",
    "poison",
    "psychic",
    "rock",
    "steel",
    "water",
  ];
  const [activeType, setActiveType] = useState(pokemonTypes); // Pokemon Types

  useEffect(() => {
    setPageLang(i18n.language);
  }, [i18n.language]);

  const observer = useRef();
  const lastItemRef = useCallback(
    (node) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          setPage((prev) => prev + 1);
          setLoading(false);
        }
      });
      if (node) observer.current.observe(node);
    },
    [loading]
  );
  console.log("pageLang", pageLang);

  // Fetch pokemon 30 by 30
  const offset = `${30 * (page - 1)}`;

  useEffect(() => {
    let mount = true;

    // Max number of Fetching Pokemon
    if (offset > 1025) {
      return;
    }

    setLoading(true);

    const fetchPokemonData = async () => {
      // Update Pokemon URL
      const fetchPokemonURL = `https://pokeapi.co/api/v2/pokemon?limit=30&offset=${offset}`;

      // Get Pokemon name and URL from limited fetchPokemonURL.
      // eg) [{ name: "bulbasaur", url: "https://pokeapi.co/api/v2/pokemon/1/" }, {}, {}, ...]
      let response = await getPokemon(fetchPokemonURL);
      console.log("response");
      console.log(response);

      const receivedPokemons = response.results;
      console.log("receivedPokemons", receivedPokemons);

      // Get each Pokemon data and push to pokemonData
      const _pokemonData2 = {
        en: [],
        ja: [],
      };
      const getEachPokemonData = async (receivedPokemons) => {
        let _rawPokemonData = await Promise.all(
          receivedPokemons.map((pokemon) => {
            // Can get abilities, height, weight, types, species(detailed information), sprites(images), etc.
            return getPokemon(pokemon.url); // pokemon.url: "https://pokeapi.co/api/v2/pokemon/1/" etc.
          })
        );
        console.log("_rawPokemonData", _rawPokemonData);
        await putPokemonDataForEachLang(_rawPokemonData);
        console.log("_pokemonData2", _pokemonData2);
      };

      const putPokemonDataForEachLang = async (_rawPokemonData) => {
        for (const pokemon of _rawPokemonData) {
          const speciesResponse = await fetch(pokemon.species.url);
          const speciesData = await speciesResponse.json();
          // console.log("speciesData", speciesData);

          // Fetch Name
          const nameEN = speciesData.names.find(
            (entry) => entry.language.name === "en"
          );
          const nameJA = speciesData.names.find(
            (entry) => entry.language.name === "ja"
          );

          // Fetch Types
          const typesEnArray = [];
          const typesJaArray = [];
          for (const type of pokemon.types) {
            const typesResponse = await fetch(type.type.url);
            const typesData = await typesResponse.json();
            // console.log("typesData", typesData);

            const typeEnEntry = typesData.names.find(
              (entry) => entry.language.name === "en"
            );
            const typeJaEntry = typesData.names.find(
              (entry) => entry.language.name === "ja"
            );
            typesEnArray.push(typeEnEntry.name);
            typesJaArray.push(typeJaEntry.name);
          }
          // console.log("pokemon.species", pokemon.species);

          // Fetch Genus
          const genusEnEntry = await speciesData.genera.find(
            (entry) => entry.language.name === "en"
          );
          const genusJaEntry = await speciesData.genera.find(
            (entry) => entry.language.name === "ja"
          );
          const genusEn = genusEnEntry.genus;
          const genusJa = genusJaEntry.genus;

          // Fetch No - no: pokemon.id
          // Fetch Height - height: pokemon.height
          // Fetch Weight - weight: pokemon.weight

          // Push data
          if (nameEN) {
            _pokemonData2.en.push({
              name: nameEN.name,
              no: pokemon.id,
              types: typesEnArray,
              genes: genusEn,
              height: pokemon.height,
              weight: pokemon.weight,
            });
            // console.log("_pokemonData2.en", _pokemonData2.en);
          }
          if (nameJA) {
            _pokemonData2.ja.push({
              name: nameJA.name,
              no: pokemon.id,
              types: typesJaArray,
              genes: genusJa,
              height: pokemon.height,
              weight: pokemon.weight,
            });
            // console.log("_pokemonData2.ja", _pokemonData2.ja);
          }
        }
        if (mount) {
          setPokemonData((prevPokemonData) => [
            ...prevPokemonData,
            ..._rawPokemonData,
          ]);
          setPokemonData2((prevPokemonData2) => ({
            en: [...prevPokemonData2.en, ..._pokemonData2.en],
            ja: [...prevPokemonData2.ja, ..._pokemonData2.ja],
          }));
          setLoading(false);
        }
      };

      getEachPokemonData(response.results);
      console.log(response.results);

      setCenterLoading(false);
    };
    fetchPokemonData();
    return () => {
      mount = false;
    };
  }, [page, offset]);

  useEffect(() => {
    console.log("Updated pokemonData2", pokemonData2);
  }, [pokemonData2]);

  const displayablePokemonArray = (query = "", activeType = []) => {
    let filteredPokemons;

    // Filter Pokemon by Name and Type from Keyword Search and Selected Types
    if (i18n.language === "en") {
      console.log("en in displayablePokemonArray");
      if (pokemonData2.en) {
        filteredPokemons = pokemonData2.en.filter((pokemon) => {
          console.log("pokemon", pokemon);
          return (
            pokemon.name.toLowerCase().includes(query.toLowerCase()) &&
            pokemon.types.some((aTypes) =>
              activeType.includes(aTypes.toLowerCase())
            )
          );
        });
      }
    } else if (i18n.language === "ja") {
      console.log("ja in displayablePokemonArray");
      if (pokemonData2.ja) {
        filteredPokemons = pokemonData2.ja.filter((pokemon) => {
          console.log("pokemon", pokemon);
          return (
            pokemon.name.toLowerCase().includes(query.toLowerCase()) &&
            pokemon.types.some((aTypes) =>
              activeType.includes(aTypes.toLowerCase())
            )
          );
        });
      }
    }

    console.log(filteredPokemons);
    return filteredPokemons;
  };

  displayablePokemonArray();

  const handleInputChange = (newQuery) => {
    // Get Key word for Search from Search box
    setQuery(newQuery);
  };
  const handleAllTypes = () => {
    // Pokemon Types All ON / All Off
    if (activeType.length >= 1) {
      console.log("All Off");
      setActiveType([]);
    } else {
      console.log("All On");
      setActiveType(pokemonTypes);
    }
  };
  const handleTypeClick = (clickedType) => {
    // Update active types by clicked type
    setActiveType((prevActiveType) => {
      if (prevActiveType.includes(clickedType)) {
        return prevActiveType.filter((type) => type !== clickedType); // As they are
      } else {
        return [...prevActiveType, clickedType]; // Add the type
      }
    });
  };
  // console.log(activeType);

  // console.log(pokemonData);

  return (
    <>
      {centerLoading ? (
        <CenterLoading t={t} />
      ) : (
        <div className="h-full bg-blue-100">
          <Navbar t={t} i18n={i18n} />
          <div className="text-center py-12">
            <div className="container mx-auto">
              <Search
                onSearchChange={handleInputChange}
                onTypeClick={handleTypeClick}
                activeType={activeType}
                pokemonTypes={pokemonTypes}
                handleAllTypes={handleAllTypes}
                t={t}
              />
              <div className="pokemonCardContainer grid sm:grid-cols-2 md:grid-cols-3 gap-x-8 sm:gap-x-0 gap-y-4 mt-8 sm:mt-14 pt-6 mb-4">
                {/* {displayablePokemonArray.map((pokemon, index) => {
                  return (
                    <Card
                      key={index}
                      pokemon={pokemon}
                      ref={
                        index === displayablePokemonArray.length - 1
                          ? lastItemRef
                          : null
                      }
                      t={t}
                    />
                  );
                })} */}
              </div>
              {loading && offset <= 1025 && <p>{t("loading")}</p>}
              {displayablePokemonArray.length === 0 && (
                <p>
                  {t("messages.noFound1")}
                  <br />
                  {t("messages.noFound2")}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default App;
