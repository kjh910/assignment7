import { PodcastsService } from "./podcasts.service"
import { Test } from "@nestjs/testing";
import { Podcast } from "./entities/podcast.entity";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Episode } from "./entities/episode.entity";
import { throwError } from "rxjs";
import { json } from "express";
import { InternalServerErrorException } from "@nestjs/common";

const mockRepository = () => ({
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    findOneOrFail: jest.fn(),
    delete: jest.fn(),
    error: jest.fn().mockImplementationOnce(() => new Error())
});

type MockRepository<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;

describe('PodcastsService', () => {
    let service: PodcastsService;
    let podcastsRepository: MockRepository<Podcast>;
    let episodesRepository: MockRepository<Episode>;

    beforeEach(async () => {
        const module = await Test.createTestingModule({
          providers: [
            PodcastsService,
            {
              provide: getRepositoryToken(Podcast),
              useValue: mockRepository(),
            },
            {
              provide: getRepositoryToken(Episode),
              useValue: mockRepository(),
            },
        ]
        }).compile();
        service = module.get<PodcastsService>(PodcastsService);
        podcastsRepository = module.get(getRepositoryToken(Podcast));
        episodesRepository = module.get(getRepositoryToken(Episode));
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('getAllPodcasts', () => {
        const args = {
            id: 1,
            createdAt: "2021-01-15T15:24:22.000Z",
            updatedAt: "2021-01-15T15:24:22.000Z",
            title: "test1",
            category: "category1",
            rating: 0
          };
        
        it('exist', async () => {
            podcastsRepository.find.mockResolvedValue(args);
            const result = await service.getAllPodcasts();
            expect(result).toEqual({
                ok: true,
                podcasts: args,
              });
        });

        it('error', async () => {
            podcastsRepository.find.mockRejectedValue(new Error());
            const result = await service.getAllPodcasts();
            expect(result).toEqual({
                ok: false,
                error: 'Internal server error occurred.',
              });
        });
    });

    describe('createPodcast', () => {
        const args = {
            title: 'titleTest',
            category: "categoryTest"
          };
        
        it('should create a new podcast', async () => {
            podcastsRepository.create.mockResolvedValue(args);
            podcastsRepository.save.mockResolvedValue(args);
            const result = await service.createPodcast(args);

            expect(podcastsRepository.create).toHaveBeenCalledTimes(1);
            expect(podcastsRepository.create).toHaveBeenCalledWith(args);

            expect(podcastsRepository.save).toHaveBeenCalledTimes(1);
            expect(podcastsRepository.save).toHaveBeenCalledWith(args);
            expect(result).toEqual({ 
              ok: true,
              id: undefined
            });
        });

        it('error', async () => {
            podcastsRepository.create.mockRejectedValue(new Error());
            podcastsRepository.save.mockRejectedValue(new Error());
            const result = await service.createPodcast(args);
            expect(result).toEqual({
                ok: false,
                error: 'Internal server error occurred.',
              });
        });
    })

    describe('getPodcast', () => {
      const args = {
        id: 1,
        createdAt: "2021-01-15T15:24:22.000Z",
        updatedAt: "2021-01-15T15:24:22.000Z",
        title: 'titleTest',
        category: "categoryTest",
        rating:1,
      };
      
      it('should fail if not exist a podcast', async () => {
          podcastsRepository.findOne.mockResolvedValue(null);
          const result = await service.getPodcast(args.id);
          expect(podcastsRepository.findOne).toHaveBeenCalledTimes(1);
          expect(podcastsRepository.findOne).toHaveBeenCalledWith(
            expect.any(Object),
            expect.any(Object)  
          );
          expect(result).toMatchObject({ 
            ok: false,
            error: 'Podcast with id 1 not found',
          });
      });

      it('should success if exist a podcast', async () => {
        podcastsRepository.findOne.mockResolvedValue(args);
        const result = await service.getPodcast(args.id);
        expect(podcastsRepository.findOne).toHaveBeenCalledTimes(1);
        expect(podcastsRepository.findOne).toHaveBeenCalledWith(
          expect.any(Object),
          expect.any(Object)  
        );
        expect(result).toEqual({
          ok:true,
          podcast:args
        });
      });

        it('should fail on exception in getPodcast', async () => {
          podcastsRepository.findOne.mockRejectedValue(new Error());
          const result = await service.getPodcast(args.id);
          expect(result).toEqual({
              ok: false,
              error: 'Internal server error occurred.',
            });
      });
    });

    describe('deletePodcast', () => {
      const args = {
        id: 1,
        createdAt: "2021-01-15T15:24:22.000Z",
        updatedAt: "2021-01-15T15:24:22.000Z",
        title: 'titleTest',
        category: "categoryTest",
        rating:1,
      };
      
      it('should not delete if not exist a podcast', async () => {
          podcastsRepository.findOne.mockResolvedValue(null);
          const result = await service.deletePodcast(args.id);
          expect(podcastsRepository.findOne).toHaveBeenCalledTimes(1);
          expect(podcastsRepository.findOne).toHaveBeenCalledWith(
            expect.any(Object),
            expect.any(Object)  
          );
          expect(result).toMatchObject({ 
            ok: false,
            error: 'Podcast with id 1 not found',
          });
      });

      it('should delete if exist a podcast', async () => {
        podcastsRepository.findOne.mockResolvedValue(args);
        const result = await service.deletePodcast(args.id);
        expect(podcastsRepository.delete).toHaveBeenCalledTimes(1);
        expect(podcastsRepository.delete).toHaveBeenCalledWith(
          {
            id:args.id
          }
        );
        expect(result).toEqual({
          ok:true
        });
      });

        it('should fail on exception in deletePodcast', async () => {
          podcastsRepository.findOne.mockResolvedValue(args);
          podcastsRepository.delete.mockRejectedValue(new Error());
          const result = await service.deletePodcast(args.id);
          expect(result).toEqual({
              ok: false,
              error: 'Internal server error occurred.',
            });
      });
    });

    describe('updatePodcast', () => {
      const argsUnderRating1 = {
        id: 1,
        payload:{
          title: 'title',
          category: "category",
          rating:7,
        }
      };

      const args = {
        id: 2,
        payload:{
          title: 'titleTest',
          category: "categoryTest",
          rating:2,
        }
      };

      const received = {
        category: "categoryTest",
        id: 2,
        payload:{
          title: 'titleTest',
          category: "categoryTest",
          rating:2,
        },
        rating: 2,
        title: "titleTest",
      };
      
      it('should not update if not exist a podcast', async () => {
          podcastsRepository.findOne.mockResolvedValue(null);
          const result = await service.updatePodcast(args);
          expect(podcastsRepository.findOne).toHaveBeenCalledTimes(1);
          expect(podcastsRepository.findOne).toHaveBeenCalledWith(
            expect.any(Object),
            expect.any(Object)  
          );
          expect(result).toMatchObject({ 
            ok: false,
            error: 'Podcast with id 2 not found',
          });
      });

      it('should not update if rating not between 1 to 5', async () => {
        podcastsRepository.findOne.mockResolvedValue(argsUnderRating1);
        const result = await service.updatePodcast(argsUnderRating1);
        expect(podcastsRepository.findOne).toHaveBeenCalledTimes(1);
        expect(podcastsRepository.findOne).toHaveBeenCalledWith(
          expect.any(Object),
          expect.any(Object)  
        );
        expect(result).toEqual({
          ok: false,
          error: 'Rating must be between 1 and 5.'
        });
      });

      it('should update if exist a podcast', async () => {
        podcastsRepository.findOne.mockResolvedValue(args);
        podcastsRepository.save.mockResolvedValue(args);
        const result = await service.updatePodcast(args);
        expect(podcastsRepository.save).toHaveBeenCalledTimes(1);
        expect(podcastsRepository.save).toHaveBeenCalledWith(
          received
        );
        expect(result).toEqual({
          ok:true
        });
      });

      it('should fail on exception in updatePodcast', async () => {
        podcastsRepository.findOne.mockResolvedValue(args);
        podcastsRepository.save.mockRejectedValue(new Error());
        const result = await service.updatePodcast(args);
        expect(result).toEqual({
          ok: false,
          error: 'Internal server error occurred.',
        });
      });
    });

    describe('getEpisodes', () => {
      const podcastArgs = {
        id: 1,
        createdAt: "2021-01-15T15:24:22.000Z",
        updatedAt: "2021-01-15T15:24:22.000Z",
        title: "test1",
        category: "category1",
        rating: 4,
        episodes:[
          {
            id:1,
            createdAt: "2021-01-15T15:24:22.000Z",
            updatedAt: "2021-01-15T15:24:22.000Z",
            title: "episodetitle1",
            category: "episodecategory1",
            rating: 4
          }
        ]
      };

      const throwErrorArgs = {
        id: 1,
        createdAt: "2021-01-15T15:24:22.000Z",
        updatedAt: "2021-01-15T15:24:22.000Z",
        title: "test1",
        category: "category1",
        rating: 4,
        episodes:
            {
              id:1,
              createdAt: "2021-01-15T15:24:22.000Z",
              updatedAt: "2021-01-15T15:24:22.000Z",
              title: "episodetitle1",
              category: "episodecategory1",
              rating: 4
            }
      }
      
      it('should not found episodes if not exist a podcast', async () => {
          podcastsRepository.findOne.mockResolvedValue(null);
          const result = await service.getEpisodes(podcastArgs.id);
          expect(podcastsRepository.findOne).toHaveBeenCalledTimes(1);
          expect(podcastsRepository.findOne).toHaveBeenCalledWith(
            expect.any(Object),
            expect.any(Object)  
          );
          expect(result).toMatchObject({ 
            ok: false,
            error: 'Podcast with id 1 not found',
          });
      });

      it('should found episodes if exist a podcast', async () => {
          podcastsRepository.findOne.mockResolvedValue(podcastArgs);
          episodesRepository.find.mockResolvedValue(podcastArgs.episodes);
          const result = await service.getEpisodes(podcastArgs.id);
          expect(podcastsRepository.findOne).toHaveBeenCalledTimes(1);
          expect(podcastsRepository.findOne).toHaveBeenCalledWith(
            {
              id:podcastArgs.id,
            },
            {
              relations:["episodes"]
            }
          );
          expect(result).toEqual({ 
            ok: true,
            episodes:podcastArgs.episodes
          });
      });

        it('should fail on exception in getEpisodes', async () => {
          podcastsRepository.findOne.mockResolvedValue(throwErrorArgs);
          const result = await service.getEpisodes(-1);
          // expect(podcastsRepository.findOne).toHaveBeenCalledTimes(1);
          // expect(podcastsRepository.findOne).toHaveBeenCalledWith(
          //   {
          //     id:podcastArgs.id,
          //   },
          //   {
          //     relations:["episodes"]
          //   }
          // );
          expect(result).toEqual({ 
            ok: false,
            error: 'Internal server error occurred.',
          });
      });
    });

    describe('getEpisode', () => {
      const podcastArgs = {
        id: 1,
        createdAt: "2021-01-15T15:24:22.000Z",
        updatedAt: "2021-01-15T15:24:22.000Z",
        title: "test1",
        category: "category1",
        rating: 4,
        episodes:[
            {
              id:1,
              createdAt: "2021-01-15T15:24:22.000Z",
              updatedAt: "2021-01-15T15:24:22.000Z",
              title: "episodetitle1",
              category: "episodecategory1",
              rating: 4
            }
          ]
      };

      const episodeArg = {
          id:1,
          createdAt: "2021-01-15T15:24:22.000Z",
          updatedAt: "2021-01-15T15:24:22.000Z",
          title: "episodetitle1",
          category: "episodecategory1",
          rating: 4
      }

      const throwErrorArgs = {
        id: 1,
        createdAt: "2021-01-15T15:24:22.000Z",
        updatedAt: "2021-01-15T15:24:22.000Z",
        title: "test1",
        category: "category1",
        rating: 4,
        episodes:
            {
              id:1,
              createdAt: "2021-01-15T15:24:22.000Z",
              updatedAt: "2021-01-15T15:24:22.000Z",
              title: "episodetitle1",
              category: "episodecategory1",
              rating: 4
            }
      }
      
      it('should not found episodes if not exist a podcast', async () => {
          podcastsRepository.findOne.mockResolvedValue(null);
          const result = await service.getEpisode({
            podcastId:podcastArgs.id,
            episodeId:episodeArg.id
          });
          expect(podcastsRepository.findOne).toHaveBeenCalledTimes(1);
          expect(podcastsRepository.findOne).toHaveBeenCalledWith(
            expect.any(Object),
            expect.any(Object)  
          );
          expect(result).toMatchObject({ 
            ok: false,
            error: 'Podcast with id 1 not found',
          });
      });

      it('should not found episodes if exist a podcast ans episodes', async () => {
          podcastsRepository.findOne.mockResolvedValue(podcastArgs);
          const result = await service.getEpisode({
            podcastId:podcastArgs.id,
            episodeId:2
          });
          expect(podcastsRepository.findOne).toHaveBeenCalledTimes(1);
          expect(podcastsRepository.findOne).toHaveBeenCalledWith(
            {
              id:podcastArgs.id,
            },
            {
              relations:["episodes"]
            }
          );
          expect(result).toEqual({ 
            ok: false,
            error: `Episode with id 2 not found in podcast with id 1`,
          });
      });

      it('should found episode if exist a podcast and episodes', async () => {
          podcastsRepository.findOne.mockResolvedValue(podcastArgs);
          const result = await service.getEpisode({
            podcastId:podcastArgs.id,
            episodeId:episodeArg.id
          });
          expect(podcastsRepository.findOne).toHaveBeenCalledTimes(1);
          expect(podcastsRepository.findOne).toHaveBeenCalledWith(
            {
              id:podcastArgs.id,
            },
            {
              relations:["episodes"]
            }
          );
          expect(result).toEqual({ 
            ok: true,
            episode:episodeArg
          });
      });

      it('should fail on exception in getEpisode', async () => {
          podcastsRepository.findOne.mockResolvedValue(throwErrorArgs);
          const result = await service.getEpisode({
            podcastId:podcastArgs.id,
            episodeId:throwErrorArgs.episodes.id
          });
          expect(podcastsRepository.findOne).toHaveBeenCalledTimes(1);
          expect(podcastsRepository.findOne).toHaveBeenCalledWith(
            {
              id:podcastArgs.id,
            },
            {
              relations:["episodes"]
            }
          );
          expect(result).toEqual({ 
            ok: false,
            error: 'Internal server error occurred.',
          });
      });
    });

    describe('createEpisode', () => {
      const podcastArgs = {
        id: 1,
        createdAt: "2021-01-15T15:24:22.000Z",
        updatedAt: "2021-01-15T15:24:22.000Z",
        title: "test1",
        category: "category1",
        rating: 4,
        episodes:[
            {
              id:1,
              createdAt: "2021-01-15T15:24:22.000Z",
              updatedAt: "2021-01-15T15:24:22.000Z",
              title: "episodetitle1",
              category: "episodecategory1",
              rating: 4
            },
          ]
      };

      const episodeArgs = {
          title: "episodetitle2",
          category: "episodecategory2",
      }
      
      it('should fail create episode if not exist a podcast', async () => {
          podcastsRepository.findOne.mockResolvedValue(null);
          const result = await service.createEpisode({
            podcastId:podcastArgs.id,
            title:episodeArgs.title,
            category:episodeArgs.category
          });
          expect(podcastsRepository.findOne).toHaveBeenCalledTimes(1);
          expect(podcastsRepository.findOne).toHaveBeenCalledWith(
            expect.any(Object),
            expect.any(Object)  
          );
          expect(result).toMatchObject({ 
            ok: false,
            error: 'Podcast with id 1 not found',
          });
      });

      it('should create episode if exist a podcast', async () => {
          podcastsRepository.findOne.mockResolvedValue(podcastArgs);
          episodesRepository.create.mockResolvedValue(episodeArgs);
          episodesRepository.save.mockResolvedValue(episodeArgs);
          const result = await service.createEpisode({
            podcastId:podcastArgs.id,
            title:episodeArgs.title,
            category:episodeArgs.category
          });
          console.log(result);
          expect(podcastsRepository.findOne).toHaveBeenCalledTimes(1);
          expect(podcastsRepository.findOne).toHaveBeenCalledWith(
            {
              id:podcastArgs.id,
            },
            {
              relations:["episodes"]
            }
          );
          expect(result).toEqual({ 
            ok: true,
            id:undefined
          });
      });

      it('should fail on exception in createEpisode', async () => {
          podcastsRepository.findOne.mockResolvedValue(podcastArgs);
          episodesRepository.create.mockRejectedValue(new Error());
          const result = await service.createEpisode({
            podcastId:podcastArgs.id,
            title:episodeArgs.title,
            category:episodeArgs.category
          });
          expect(podcastsRepository.findOne).toHaveBeenCalledTimes(1);
          expect(podcastsRepository.findOne).toHaveBeenCalledWith(
            {
              id:podcastArgs.id,
            },
            {
              relations:["episodes"]
            }
          );
          expect(result).toEqual({ 
            ok: false,
            error: 'Internal server error occurred.',
          });
      });
    });

    describe('deleteEpisode', () => {
      const podcastArgs = {
        id: 1,
        createdAt: "2021-01-15T15:24:22.000Z",
        updatedAt: "2021-01-15T15:24:22.000Z",
        title: "test1",
        category: "category1",
        rating: 4,
        episodes:[
            {
              id:1,
              createdAt: "2021-01-15T15:24:22.000Z",
              updatedAt: "2021-01-15T15:24:22.000Z",
              title: "episodetitle1",
              category: "episodecategory1",
              rating: 4
            },
          ]
      };

      const episodeArg = {
          id:1
      }
      
      it('should fail delete episode if not exist a podcast', async () => {
          podcastsRepository.findOne.mockResolvedValue(null);
          const result = await service.deleteEpisode({
            podcastId:podcastArgs.id,
            episodeId:episodeArg.id
          });
          expect(podcastsRepository.findOne).toHaveBeenCalledTimes(1);
          expect(podcastsRepository.findOne).toHaveBeenCalledWith(
            expect.any(Object),
            expect.any(Object)  
          );
          expect(result).toMatchObject({ 
            ok: false,
            error: 'Podcast with id 1 not found',
          });
      });

      it('should delete episode if exist a podcast', async () => {
          podcastsRepository.findOne.mockResolvedValue(podcastArgs);
          episodesRepository.delete.mockResolvedValue(episodeArg);
          const result = await service.deleteEpisode({
            podcastId:podcastArgs.id,
            episodeId:episodeArg.id
          });
          expect(podcastsRepository.findOne).toHaveBeenCalledTimes(1);
          expect(podcastsRepository.findOne).toHaveBeenCalledWith(
            {
              id:podcastArgs.id,
            },
            {
              relations:["episodes"]
            }
          );

          expect(episodesRepository.delete).toHaveBeenCalledTimes(1);
          expect(episodesRepository.delete).toHaveBeenCalledWith(
            {
              id:episodeArg.id
            }
          );
          expect(result).toEqual({ 
            ok: true,
          });
      });

      it('should fail on exception in deleteEpisode', async () => {
          podcastsRepository.findOne.mockResolvedValue(podcastArgs);
          episodesRepository.delete.mockRejectedValue(new Error());
          const result = await service.deleteEpisode({
            podcastId:podcastArgs.id,
            episodeId:episodeArg.id
          });
          expect(podcastsRepository.findOne).toHaveBeenCalledTimes(1);
          expect(episodesRepository.delete).toHaveBeenCalledWith(
            {
              id:episodeArg.id
            }
          );
          expect(result).toEqual({ 
            ok: false,
            error: 'Internal server error occurred.',
          });
      });
    });

    describe('updateEpisode', () => {
      const podcastArgs = {
        id: 1,
        createdAt: "2021-01-15T15:24:22.000Z",
        updatedAt: "2021-01-15T15:24:22.000Z",
        title: "test1",
        category: "category1",
        rating: 4,
        episodes:[
            {
              id:1,
              createdAt: "2021-01-15T15:24:22.000Z",
              updatedAt: "2021-01-15T15:24:22.000Z",
              title: "episodetitle1",
              category: "episodecategory1",
              rating: 4
            },
          ]
      };

      const updatedEpisode = {
        id:1,
        createdAt: "2021-01-15T15:24:22.000Z",
        updatedAt: "2021-01-15T15:24:22.000Z",
        title: "updateTitle1",
        category: "updateCategory1",
        rating:4
      }

      const episodeArgs = {
          id:1,
          title:"updateTitle1",
          category:"updateCategory1"
      }
      
      it('should fail update episode if not exist a podcast', async () => {
          podcastsRepository.findOne.mockResolvedValue(null);
          const result = await service.updateEpisode({
            podcastId:podcastArgs.id,
            episodeId:episodeArgs.id,
            title:episodeArgs.title,
            category:episodeArgs.category,
          });
          expect(podcastsRepository.findOne).toHaveBeenCalledTimes(1);
          expect(podcastsRepository.findOne).toHaveBeenCalledWith(
            expect.any(Object),
            expect.any(Object)  
          );
          expect(result).toMatchObject({ 
            ok: false,
            error: 'Podcast with id 1 not found',
          });
      });

      it('should update episode if exist a podcast', async () => {
          podcastsRepository.findOne.mockResolvedValue(podcastArgs);
          episodesRepository.save.mockResolvedValue(updatedEpisode);
          const result = await service.updateEpisode({
            podcastId:podcastArgs.id,
            episodeId:episodeArgs.id,
            title:episodeArgs.title,
            category:episodeArgs.category,
          });
          expect(podcastsRepository.findOne).toHaveBeenCalledTimes(1);
          expect(podcastsRepository.findOne).toHaveBeenCalledWith(
            {
              id:podcastArgs.id,
            },
            {
              relations:["episodes"]
            }
          );

          expect(episodesRepository.save).toHaveBeenCalledTimes(1);
          expect(episodesRepository.save).toHaveBeenCalledWith(
            updatedEpisode
          );
          expect(result).toEqual({ 
            ok: true,
          });
      });

      it('should fail on exception in updateEpisode', async () => {
          podcastsRepository.findOne.mockResolvedValue(podcastArgs);
          episodesRepository.save.mockRejectedValue(new Error());
          const result =  await service.updateEpisode({
            podcastId:podcastArgs.id,
            episodeId:episodeArgs.id,
            title:episodeArgs.title,
            category:episodeArgs.category,
          });
          expect(podcastsRepository.findOne).toHaveBeenCalledTimes(1);
          expect(episodesRepository.save).toHaveBeenCalledWith(
            updatedEpisode
          );
          expect(result).toEqual({ 
            ok: false,
            error: 'Internal server error occurred.',
          });
      });
    });
});